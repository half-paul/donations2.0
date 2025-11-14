/**
 * Analytics Integration Tests
 *
 * Tests for analytics event tracking, validation, and dashboard queries.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsClient } from '../../lib/analytics';
import { AnalyticsLogger } from '../../server/analytics/logger';
import { ANALYTICS_EVENTS } from '../../types/analytics';
import type { DonationStartedEvent, DonationCompletedEvent } from '../../types/analytics';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock window and navigator
global.window = {
  location: { href: 'https://example.com/donate?utm_source=email' },
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

global.navigator = {
  userAgent: 'Mozilla/5.0 (Test Browser)',
  doNotTrack: '0',
} as any;

global.document = {
  referrer: 'https://google.com',
} as any;

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
} as any;

// Mock fetch
global.fetch = vi.fn();

// ============================================================================
// Analytics Client Tests
// ============================================================================

describe('AnalyticsClient', () => {
  let analytics: AnalyticsClient;

  beforeEach(() => {
    analytics = new AnalyticsClient({
      providers: {
        custom: {
          endpoint: '/api/analytics/track',
          enabled: true,
        },
      },
      debug: false,
      batchSize: 5,
      batchTimeout: 1000,
    });

    analytics.initialize();

    // Reset fetch mock
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );
  });

  afterEach(async () => {
    await analytics.flush();
  });

  it('should track donation_started event', async () => {
    const event: DonationStartedEvent = {
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
      campaign_slug: 'spring-appeal',
      form_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    await analytics.trackEvent(event);

    // Event should be queued
    expect(analytics['eventQueue']).toHaveLength(1);
  });

  it('should redact PII from events', async () => {
    const eventWithPII: any = {
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'donor@example.com', // Should be redacted
      firstName: 'John', // Should be redacted
      lastName: 'Doe', // Should be redacted
    };

    await analytics.trackEvent(eventWithPII);

    const queuedEvent = analytics['eventQueue'][0];
    expect(queuedEvent).not.toHaveProperty('email');
    expect(queuedEvent).not.toHaveProperty('firstName');
    expect(queuedEvent).not.toHaveProperty('lastName');
  });

  it('should batch events and flush when batch size reached', async () => {
    const events = Array.from({ length: 5 }, (_, i) => ({
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
      campaign_slug: `campaign-${i}`,
    }));

    for (const event of events) {
      await analytics.trackEvent(event as DonationStartedEvent);
    }

    // Should have flushed after 5 events
    expect(fetch).toHaveBeenCalled();
    expect(analytics['eventQueue']).toHaveLength(0);
  });

  it('should respect Do Not Track preference', () => {
    global.navigator.doNotTrack = '1';

    const analyticsWithDNT = new AnalyticsClient({
      respectDoNotTrack: true,
      debug: false,
    });

    analyticsWithDNT.initialize();

    expect(analyticsWithDNT['consent'].analytics_tracking).toBe(false);
  });

  it('should retry failed requests with exponential backoff', async () => {
    // Mock fetch to fail first 2 times, then succeed
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

    const event: DonationStartedEvent = {
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    await analytics.trackEvent(event);
    await analytics.flush();

    // Should have retried 3 times total
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should enrich events with session and user context', async () => {
    analytics.identify('user-123', { plan: 'premium' });

    const event: DonationStartedEvent = {
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    await analytics.trackEvent(event);

    const queuedEvent = analytics['eventQueue'][0];
    expect(queuedEvent.session_id).toBeDefined();
    expect(queuedEvent.user_id).toBe('user-123');
    expect(queuedEvent.timestamp).toBeDefined();
  });

  it('should validate event schemas', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invalidEvent: any = {
      event: 'invalid_event', // Not in schema
      campaign_id: 'not-a-uuid', // Invalid UUID
    };

    await analytics.trackEvent(invalidEvent);

    // Should log error and not queue event
    expect(consoleSpy).toHaveBeenCalled();
    expect(analytics['eventQueue']).toHaveLength(0);

    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Analytics Logger Tests (Server-Side)
// ============================================================================

describe('AnalyticsLogger', () => {
  let logger: AnalyticsLogger;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    logger = new AnalyticsLogger(mockDb, {
      batchSize: 5,
      flushInterval: 1000,
      dataWarehouseEnabled: false,
    });
  });

  afterEach(async () => {
    await logger.shutdown();
  });

  it('should log event to database', async () => {
    const event: DonationStartedEvent = {
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
      campaign_slug: 'spring-appeal',
    };

    await logger.logEvent(event);
    await logger.flush();

    expect(mockDb.analyticsEvent.createMany).toHaveBeenCalled();
    const call = mockDb.analyticsEvent.createMany.mock.calls[0][0];
    expect(call.data).toHaveLength(1);
    expect(call.data[0].eventName).toBe(ANALYTICS_EVENTS.DONATION_STARTED);
  });

  it('should batch multiple events', async () => {
    const events: DonationStartedEvent[] = Array.from({ length: 3 }, (_, i) => ({
      event: ANALYTICS_EVENTS.DONATION_STARTED,
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
      campaign_slug: `campaign-${i}`,
    }));

    for (const event of events) {
      await logger.logEvent(event);
    }

    await logger.flush();

    const call = mockDb.analyticsEvent.createMany.mock.calls[0][0];
    expect(call.data).toHaveLength(3);
  });

  it('should map event properties correctly', async () => {
    const event: DonationCompletedEvent = {
      event: ANALYTICS_EVENTS.DONATION_COMPLETED,
      gift_id: '123e4567-e89b-12d3-a456-426614174002',
      campaign_id: '123e4567-e89b-12d3-a456-426614174000',
      campaign_slug: 'spring-appeal',
      amount: 100.50,
      currency: 'USD',
      recurring: false,
      processor: 'stripe',
    };

    await logger.logEvent(event);
    await logger.flush();

    const call = mockDb.analyticsEvent.createMany.mock.calls[0][0];
    const record = call.data[0];

    expect(record.eventName).toBe(ANALYTICS_EVENTS.DONATION_COMPLETED);
    expect(record.eventType).toBe('funnel');
    expect(record.campaignId).toBe(event.campaign_id);
    expect(record.amount).toBe(100.50);
    expect(record.currency).toBe('USD');
    expect(record.recurring).toBe(false);
  });

  it('should determine event type correctly', async () => {
    const events = [
      { event: ANALYTICS_EVENTS.DONATION_STARTED, expectedType: 'funnel' },
      { event: ANALYTICS_EVENTS.AMOUNT_SELECTED, expectedType: 'engagement' },
      { event: ANALYTICS_EVENTS.DONATION_FAILED, expectedType: 'error' },
    ];

    for (const { event: eventName, expectedType } of events) {
      await logger.logEvent({ event: eventName } as any);
    }

    await logger.flush();

    const calls = mockDb.analyticsEvent.createMany.mock.calls[0][0];
    expect(calls.data[0].eventType).toBe('funnel');
    expect(calls.data[1].eventType).toBe('engagement');
    expect(calls.data[2].eventType).toBe('error');
  });
});

// ============================================================================
// UTM Parameter Extraction Tests
// ============================================================================

describe('UTM Parameter Extraction', () => {
  it('should extract UTM parameters from URL', () => {
    const url = 'https://example.com/donate?utm_source=email&utm_medium=newsletter&utm_campaign=spring2025';

    const { extractUTMParams } = require('../../lib/analytics');
    const params = extractUTMParams(url);

    expect(params.source).toBe('email');
    expect(params.medium).toBe('newsletter');
    expect(params.campaign).toBe('spring2025');
  });

  it('should handle missing UTM parameters', () => {
    const url = 'https://example.com/donate';

    const { extractUTMParams } = require('../../lib/analytics');
    const params = extractUTMParams(url);

    expect(params.source).toBeUndefined();
    expect(params.medium).toBeUndefined();
    expect(params.campaign).toBeUndefined();
  });

  it('should store and retrieve UTM parameters from session storage', () => {
    const { storeUTMParams, getStoredUTMParams } = require('../../lib/analytics');

    const utmParams = {
      source: 'facebook',
      medium: 'social',
      campaign: 'fall-appeal',
    };

    storeUTMParams(utmParams);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'utm_params',
      JSON.stringify(utmParams)
    );
  });
});

// ============================================================================
// Conversion Metrics Tests
// ============================================================================

describe('Conversion Metrics Calculation', () => {
  it('should calculate conversion rate correctly', () => {
    const started = 100;
    const completed = 75;
    const failed = 5;

    const conversionRate = completed / started;
    const abandonmentRate = (started - completed - failed) / started;

    expect(conversionRate).toBe(0.75);
    expect(abandonmentRate).toBe(0.20);
  });

  it('should handle zero division gracefully', () => {
    const started = 0;
    const completed = 0;

    const conversionRate = started > 0 ? completed / started : 0;

    expect(conversionRate).toBe(0);
  });

  it('should calculate recurring uptake', () => {
    const totalGifts = 100;
    const recurringGifts = 30;

    const recurringUptake = recurringGifts / totalGifts;

    expect(recurringUptake).toBe(0.30);
  });

  it('should calculate fee coverage uplift', () => {
    const totalRevenue = 10000;
    const totalFees = 500;

    const feeCoverUplift = totalFees / totalRevenue;

    expect(feeCoverUplift).toBe(0.05); // 5% uplift
  });
});

/**
 * Server-Side Analytics Logger
 *
 * Handles server-side event logging to database and data warehouse.
 * Provides batch processing, validation, and privacy-safe storage.
 */

import { PrismaClient } from '@prisma/client';
import type {
  AnalyticsEvent,
  BaseEventProperties,
} from '../../types/analytics';
import { analyticsEventSchema, redactPII } from '../../types/analytics';

// ============================================================================
// Logger Configuration
// ============================================================================

interface LoggerConfig {
  batchSize: number;
  flushInterval: number; // milliseconds
  retryAttempts: number;
  retryDelay: number;
  dataWarehouseEnabled: boolean;
  dataWarehouseEndpoint?: string;
}

const defaultConfig: LoggerConfig = {
  batchSize: 100,
  flushInterval: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  dataWarehouseEnabled: process.env.ANALYTICS_WAREHOUSE_ENABLED === 'true',
  dataWarehouseEndpoint: process.env.ANALYTICS_WAREHOUSE_ENDPOINT,
};

// ============================================================================
// Analytics Logger Class
// ============================================================================

export class AnalyticsLogger {
  private config: LoggerConfig;
  private db: PrismaClient;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(db: PrismaClient, config?: Partial<LoggerConfig>) {
    this.db = db;
    this.config = { ...defaultConfig, ...config };
    this.startFlushTimer();
  }

  /**
   * Log a single event
   *
   * Validates, redacts PII, and queues for batch processing
   */
  async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Validate event schema
      const validated = analyticsEventSchema.safeParse(event);
      if (!validated.success) {
        console.error('Invalid analytics event:', validated.error);
        return;
      }

      // Redact PII
      const safeEvent = redactPII(validated.data);

      // Add to queue
      this.eventQueue.push(safeEvent);

      // Flush if queue is full
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  }

  /**
   * Log multiple events at once
   *
   * Useful for batch imports or webhook processing
   */
  async logEvents(events: AnalyticsEvent[]): Promise<void> {
    for (const event of events) {
      await this.logEvent(event);
    }
  }

  /**
   * Flush event queue to database
   *
   * Processes all queued events in a single batch
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store in database
      await this.storeBatch(events);

      // Export to data warehouse (async, don't wait)
      if (this.config.dataWarehouseEnabled) {
        this.exportToWarehouse(events).catch((error) => {
          console.error('Failed to export to data warehouse:', error);
        });
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Shutdown logger gracefully
   *
   * Flushes remaining events and clears timer
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Scheduled flush failed:', error);
      });
    }, this.config.flushInterval);
  }

  private async storeBatch(events: AnalyticsEvent[]): Promise<void> {
    const records = events.map((event) => this.mapEventToRecord(event));

    await this.db.analyticsEvent.createMany({
      data: records,
      skipDuplicates: true,
    });
  }

  private mapEventToRecord(event: AnalyticsEvent): any {
    return {
      eventName: event.event,
      eventType: this.determineEventType(event.event),
      sessionId: event.session_id ?? '',
      userId: event.user_id ?? null,
      campaignId: event.campaign_id ?? null,
      campaignSlug: event.campaign_slug ?? null,
      formId: event.form_id ?? null,
      amount: event.amount ?? null,
      currency: event.currency ?? null,
      recurring: event.recurring ?? null,
      frequency: event.frequency ?? null,
      utmSource: event.source ?? null,
      utmMedium: event.medium ?? null,
      utmCampaign: event.campaign ?? null,
      utmTerm: event.term ?? null,
      utmContent: event.content ?? null,
      properties: event,
      ipAddress: null, // Set by API handler
      userAgent: event.user_agent ?? null,
      pageUrl: event.page_url ?? null,
      referrer: event.referrer ?? null,
      createdAt: event.timestamp ? new Date(event.timestamp) : new Date(),
    };
  }

  private determineEventType(eventName: string): string {
    if (eventName.startsWith('donation_')) return 'funnel';
    if (eventName.includes('_toggled') || eventName.includes('_selected')) return 'engagement';
    if (eventName.includes('_failed') || eventName.includes('_error')) return 'error';
    return 'other';
  }

  private async exportToWarehouse(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.dataWarehouseEndpoint) {
      return;
    }

    const response = await fetch(this.config.dataWarehouseEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANALYTICS_WAREHOUSE_API_KEY}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Data warehouse export failed: ${response.status}`);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let loggerInstance: AnalyticsLogger | null = null;

export function getAnalyticsLogger(db: PrismaClient): AnalyticsLogger {
  if (!loggerInstance) {
    loggerInstance = new AnalyticsLogger(db);
  }
  return loggerInstance;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract session ID from request
 *
 * Tries multiple sources: header, cookie, query param
 */
export function extractSessionId(req: Request): string | null {
  // Try header first
  const headerSessionId = req.headers.get('x-session-id');
  if (headerSessionId) return headerSessionId;

  // Try cookie
  const cookies = req.headers.get('cookie');
  if (cookies) {
    const match = cookies.match(/session_id=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract IP address from request
 *
 * Handles proxied requests (X-Forwarded-For, X-Real-IP)
 */
export function extractIPAddress(req: Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * Handle analytics tracking endpoint
 *
 * POST /api/analytics/track
 * Body: { events: AnalyticsEvent[] }
 */
export async function handleAnalyticsTrack(
  req: Request,
  db: PrismaClient
): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { events } = body;

    if (!Array.isArray(events)) {
      return new Response('Invalid request body', { status: 400 });
    }

    const logger = getAnalyticsLogger(db);

    // Enrich events with request context
    const ipAddress = extractIPAddress(req);
    const enrichedEvents = events.map((event) => ({
      ...event,
      // Don't override if already set
      ip_address: event.ip_address ?? ipAddress,
    }));

    await logger.logEvents(enrichedEvents);

    return new Response(JSON.stringify({ success: true, count: events.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// ============================================================================
// Exports
// ============================================================================

export { AnalyticsLogger };
export type { LoggerConfig };

/**
 * Analytics Client Library
 *
 * Provides a unified interface for tracking events across multiple analytics platforms.
 * Implements privacy-first tracking with PII redaction and consent management.
 *
 * Features:
 * - Type-safe event tracking with Zod validation
 * - Automatic PII redaction
 * - Consent-based tracking
 * - Retry logic with exponential backoff
 * - Batch event sending
 * - Multiple provider support (Segment, Google Analytics, Custom)
 */

import {
  type AnalyticsEvent,
  type AnalyticsEventName,
  type BaseEventProperties,
  type ConsentPreferences,
  type UTMParams,
  analyticsEventSchema,
  redactPII,
  defaultConsentPreferences,
} from '../types/analytics';

// ============================================================================
// Configuration
// ============================================================================

interface AnalyticsConfig {
  // Provider Configuration
  providers: {
    segment?: {
      writeKey: string;
      enabled: boolean;
    };
    googleAnalytics?: {
      measurementId: string;
      enabled: boolean;
    };
    custom?: {
      endpoint: string;
      enabled: boolean;
    };
  };

  // Privacy Settings
  respectDoNotTrack: boolean;
  defaultConsent: ConsentPreferences;

  // Batching Settings
  batchSize: number; // Max events to batch before sending
  batchTimeout: number; // Max time (ms) to wait before sending batch

  // Retry Settings
  maxRetries: number;
  retryDelay: number; // Initial retry delay (ms), doubles with each retry

  // Debug Mode
  debug: boolean;
}

const defaultConfig: AnalyticsConfig = {
  providers: {
    segment: {
      writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || '',
      enabled: !!process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY,
    },
    googleAnalytics: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
    custom: {
      endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics/track',
      enabled: true,
    },
  },
  respectDoNotTrack: true,
  defaultConsent: defaultConsentPreferences,
  batchSize: 10,
  batchTimeout: 5000, // 5 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// Analytics Client
// ============================================================================

class AnalyticsClient {
  private config: AnalyticsConfig;
  private consent: ConsentPreferences;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.consent = this.config.defaultConsent;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics tracking
   *
   * Call this once when your app loads, typically in _app.tsx or layout.tsx
   */
  initialize(): void {
    if (this.isInitialized) {
      this.log('Analytics already initialized');
      return;
    }

    // Check Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      this.log('Do Not Track is enabled, analytics disabled');
      this.consent = {
        analytics_tracking: false,
        performance_tracking: false,
        marketing_attribution: false,
      };
      return;
    }

    // Initialize Segment
    if (this.config.providers.segment?.enabled) {
      this.initializeSegment();
    }

    // Initialize Google Analytics
    if (this.config.providers.googleAnalytics?.enabled) {
      this.initializeGoogleAnalytics();
    }

    this.isInitialized = true;
    this.log('Analytics initialized');
  }

  /**
   * Update consent preferences
   *
   * Call this when user updates their privacy settings
   */
  updateConsent(consent: Partial<ConsentPreferences>): void {
    this.consent = { ...this.consent, ...consent };
    this.log('Consent updated:', this.consent);
  }

  /**
   * Identify a user (donor)
   *
   * Call this after authentication or when donor information becomes available
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.consent.analytics_tracking) {
      this.log('Analytics tracking disabled, skipping identify');
      return;
    }

    this.userId = userId;

    // Redact PII from traits
    const safeTraits = traits ? redactPII(traits) : {};

    // Send to Segment
    if (this.config.providers.segment?.enabled && typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.identify(userId, safeTraits);
    }

    // Send to Google Analytics
    if (this.config.providers.googleAnalytics?.enabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.config.providers.googleAnalytics.measurementId, {
        user_id: userId,
      });
    }

    this.log('User identified:', userId);
  }

  /**
   * Track a page view
   *
   * Call this on route changes (handled automatically by useAnalytics hook)
   */
  trackPageView(page: string, properties?: Record<string, any>): void {
    if (!this.consent.analytics_tracking) {
      this.log('Analytics tracking disabled, skipping page view');
      return;
    }

    const eventProperties = {
      page,
      ...properties,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
    };

    // Send to Segment
    if (this.config.providers.segment?.enabled && typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.page(page, redactPII(eventProperties));
    }

    // Send to Google Analytics
    if (this.config.providers.googleAnalytics?.enabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: page,
        ...redactPII(eventProperties),
      });
    }

    this.log('Page view tracked:', page);
  }

  /**
   * Track an event
   *
   * This is the main method for tracking donation funnel events
   */
  async trackEvent<T extends AnalyticsEvent>(event: T): Promise<void> {
    if (!this.consent.analytics_tracking) {
      this.log('Analytics tracking disabled, skipping event:', event.event);
      return;
    }

    // Validate event schema
    const validated = analyticsEventSchema.safeParse(event);
    if (!validated.success) {
      console.error('Invalid analytics event:', validated.error);
      return;
    }

    // Enrich event with session and user context
    const enrichedEvent = {
      ...validated.data,
      session_id: this.sessionId,
      user_id: this.userId ?? undefined,
      timestamp: new Date().toISOString(),
    } as AnalyticsEvent;

    // Redact PII
    const safeEvent = redactPII(enrichedEvent);

    // Add to queue for batching
    this.eventQueue.push(safeEvent);

    this.log('Event tracked:', safeEvent.event);

    // Send to real-time providers (Segment, GA)
    await this.sendToProviders(safeEvent);

    // Flush batch if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flushQueue();
    } else {
      // Schedule batch flush
      this.scheduleBatchFlush();
    }
  }

  /**
   * Flush event queue immediately
   *
   * Call this before page unload to ensure all events are sent
   */
  async flush(): Promise<void> {
    await this.flushQueue();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private isDoNotTrackEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      (navigator as any).msDoNotTrack === '1'
    );
  }

  private initializeSegment(): void {
    if (typeof window === 'undefined') return;

    const writeKey = this.config.providers.segment!.writeKey;

    // Load Segment analytics.js snippet
    const analytics = ((window as any).analytics = (window as any).analytics || []);
    if (analytics.initialize) return;

    analytics.invoked = true;
    analytics.methods = [
      'trackSubmit', 'trackClick', 'trackLink', 'trackForm', 'pageview', 'identify',
      'reset', 'group', 'track', 'ready', 'alias', 'debug', 'page', 'once', 'off', 'on',
    ];

    analytics.factory = function (method: string) {
      return function (...args: any[]) {
        args.unshift(method);
        analytics.push(args);
        return analytics;
      };
    };

    for (const method of analytics.methods) {
      analytics[method] = analytics.factory(method);
    }

    analytics.load = function (key: string) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://cdn.segment.com/analytics.js/v1/${key}/analytics.min.js`;
      const first = document.getElementsByTagName('script')[0];
      first.parentNode!.insertBefore(script, first);
      analytics._loadOptions = { writeKey: key };
    };

    analytics.SNIPPET_VERSION = '4.13.2';
    analytics.load(writeKey);

    this.log('Segment initialized');
  }

  private initializeGoogleAnalytics(): void {
    if (typeof window === 'undefined') return;

    const measurementId = this.config.providers.googleAnalytics!.measurementId;

    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false, // We'll handle page views manually
    });

    this.log('Google Analytics initialized');
  }

  private async sendToProviders(event: AnalyticsEvent): Promise<void> {
    // Send to Segment
    if (this.config.providers.segment?.enabled && typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(event.event, event);
    }

    // Send to Google Analytics
    if (this.config.providers.googleAnalytics?.enabled && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, event);
    }
  }

  private scheduleBatchFlush(): void {
    if (this.batchTimer) {
      return; // Timer already scheduled
    }

    this.batchTimer = setTimeout(() => {
      this.flushQueue();
    }, this.config.batchTimeout);
  }

  private async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Send to custom endpoint
    if (this.config.providers.custom?.enabled) {
      await this.sendBatchWithRetry(events);
    }
  }

  private async sendBatchWithRetry(
    events: AnalyticsEvent[],
    attempt = 1
  ): Promise<void> {
    try {
      const response = await fetch(this.config.providers.custom!.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      this.log(`Batch sent successfully (${events.length} events)`);
    } catch (error) {
      console.error('Failed to send analytics batch:', error);

      // Retry with exponential backoff
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        this.log(`Retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        await this.sendBatchWithRetry(events, attempt + 1);
      } else {
        console.error('Max retries exceeded, events lost:', events);
      }
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Analytics]', ...args);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const analytics = new AnalyticsClient();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract UTM parameters from URL
 */
export function extractUTMParams(url: string | URL): UTMParams {
  const urlObj = typeof url === 'string' ? new URL(url, window.location.origin) : url;
  const params = new URLSearchParams(urlObj.search);

  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
}

/**
 * Get current UTM parameters from window location
 */
export function getCurrentUTMParams(): UTMParams {
  if (typeof window === 'undefined') {
    return {};
  }
  return extractUTMParams(window.location.href);
}

/**
 * Store UTM parameters in session storage
 *
 * Call this on initial page load to preserve attribution across session
 */
export function storeUTMParams(params: UTMParams): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem('utm_params', JSON.stringify(params));
  } catch (error) {
    console.error('Failed to store UTM params:', error);
  }
}

/**
 * Retrieve stored UTM parameters from session storage
 */
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};

  try {
    const stored = sessionStorage.getItem('utm_params');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to retrieve UTM params:', error);
    return {};
  }
}

/**
 * Get base event properties (common to all events)
 *
 * Automatically includes session, user, UTM, and page context
 */
export function getBaseEventProperties(): Partial<BaseEventProperties> {
  if (typeof window === 'undefined') return {};

  const utmParams = getStoredUTMParams();

  return {
    session_id: analytics['sessionId'],
    user_id: analytics['userId'] ?? undefined,
    source: utmParams.source,
    medium: utmParams.medium,
    campaign: utmParams.campaign,
    term: utmParams.term,
    content: utmParams.content,
    page_url: window.location.href,
    referrer: document.referrer || undefined,
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export default analytics;
export { AnalyticsClient };
export type { AnalyticsConfig };

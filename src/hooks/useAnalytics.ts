/**
 * Analytics React Hooks
 *
 * Provides React hooks for easy analytics integration in components.
 * Handles automatic page view tracking, event tracking, and lifecycle management.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  analytics,
  getCurrentUTMParams,
  storeUTMParams,
  getBaseEventProperties,
} from '../lib/analytics';
import type {
  AnalyticsEvent,
  DonationStartedEvent,
  AmountSelectedEvent,
  RecurringToggledEvent,
  TributeAddedEvent,
  FeeCoverageToggledEvent,
  DonorInfoSubmittedEvent,
  PaymentSubmittedEvent,
  DonationCompletedEvent,
  DonationFailedEvent,
  ConsentPreferences,
} from '../types/analytics';
import { ANALYTICS_EVENTS } from '../types/analytics';

// ============================================================================
// useAnalytics - Main Analytics Hook
// ============================================================================

/**
 * Main analytics hook
 *
 * Provides methods for tracking events and managing analytics state.
 * Auto-initializes analytics on mount.
 *
 * @example
 * ```tsx
 * const { trackEvent, identify } = useAnalytics();
 *
 * // Track donation started
 * trackEvent({
 *   event: 'donation_started',
 *   campaign_id: 'abc-123',
 *   campaign_slug: 'spring-appeal',
 * });
 * ```
 */
export function useAnalytics() {
  const initializeRef = useRef(false);

  useEffect(() => {
    if (!initializeRef.current) {
      analytics.initialize();
      initializeRef.current = true;
    }
  }, []);

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    await analytics.trackEvent(event);
  }, []);

  const identify = useCallback((userId: string, traits?: Record<string, any>) => {
    analytics.identify(userId, traits);
  }, []);

  const updateConsent = useCallback((consent: Partial<ConsentPreferences>) => {
    analytics.updateConsent(consent);
  }, []);

  return {
    trackEvent,
    identify,
    updateConsent,
  };
}

// ============================================================================
// usePageTracking - Automatic Page View Tracking
// ============================================================================

/**
 * Automatic page view tracking
 *
 * Tracks page views on route changes.
 * Extracts and stores UTM parameters on initial load.
 *
 * @example
 * ```tsx
 * // In app layout or _app.tsx
 * usePageTracking();
 * ```
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract and store UTM parameters
    const utmParams = getCurrentUTMParams();
    if (Object.keys(utmParams).length > 0) {
      storeUTMParams(utmParams);
    }
  }, []); // Only on mount

  useEffect(() => {
    // Track page view on route change
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    analytics.trackPageView(url);
  }, [pathname, searchParams]);
}

// ============================================================================
// useDonationFunnelTracking - Donation Funnel Events
// ============================================================================

/**
 * Donation funnel tracking helpers
 *
 * Provides type-safe methods for tracking donation funnel events.
 *
 * @example
 * ```tsx
 * const { trackDonationStarted, trackAmountSelected } = useDonationFunnelTracking();
 *
 * useEffect(() => {
 *   trackDonationStarted({
 *     campaign_id: campaign.id,
 *     campaign_slug: campaign.slug,
 *   });
 * }, []);
 * ```
 */
export function useDonationFunnelTracking() {
  const { trackEvent } = useAnalytics();

  const trackDonationStarted = useCallback(
    (properties: Omit<DonationStartedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.DONATION_STARTED,
        ...getBaseEventProperties(),
        ...properties,
      } as DonationStartedEvent);
    },
    [trackEvent]
  );

  const trackAmountSelected = useCallback(
    (properties: Omit<AmountSelectedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.AMOUNT_SELECTED,
        ...getBaseEventProperties(),
        ...properties,
      } as AmountSelectedEvent);
    },
    [trackEvent]
  );

  const trackRecurringToggled = useCallback(
    (properties: Omit<RecurringToggledEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.RECURRING_TOGGLED,
        ...getBaseEventProperties(),
        ...properties,
      } as RecurringToggledEvent);
    },
    [trackEvent]
  );

  const trackTributeAdded = useCallback(
    (properties: Omit<TributeAddedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.TRIBUTE_ADDED,
        ...getBaseEventProperties(),
        ...properties,
      } as TributeAddedEvent);
    },
    [trackEvent]
  );

  const trackFeeCoverageToggled = useCallback(
    (properties: Omit<FeeCoverageToggledEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.FEE_COVERAGE_TOGGLED,
        ...getBaseEventProperties(),
        ...properties,
      } as FeeCoverageToggledEvent);
    },
    [trackEvent]
  );

  const trackDonorInfoSubmitted = useCallback(
    (properties: Omit<DonorInfoSubmittedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.DONOR_INFO_SUBMITTED,
        ...getBaseEventProperties(),
        ...properties,
      } as DonorInfoSubmittedEvent);
    },
    [trackEvent]
  );

  const trackPaymentSubmitted = useCallback(
    (properties: Omit<PaymentSubmittedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.PAYMENT_SUBMITTED,
        ...getBaseEventProperties(),
        ...properties,
      } as PaymentSubmittedEvent);
    },
    [trackEvent]
  );

  const trackDonationCompleted = useCallback(
    (properties: Omit<DonationCompletedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.DONATION_COMPLETED,
        ...getBaseEventProperties(),
        ...properties,
      } as DonationCompletedEvent);
    },
    [trackEvent]
  );

  const trackDonationFailed = useCallback(
    (properties: Omit<DonationFailedEvent, 'event'>) => {
      trackEvent({
        event: ANALYTICS_EVENTS.DONATION_FAILED,
        ...getBaseEventProperties(),
        ...properties,
      } as DonationFailedEvent);
    },
    [trackEvent]
  );

  return {
    trackDonationStarted,
    trackAmountSelected,
    trackRecurringToggled,
    trackTributeAdded,
    trackFeeCoverageToggled,
    trackDonorInfoSubmitted,
    trackPaymentSubmitted,
    trackDonationCompleted,
    trackDonationFailed,
  };
}

// ============================================================================
// useBeforeUnload - Flush Events on Page Unload
// ============================================================================

/**
 * Flush analytics events before page unload
 *
 * Ensures all pending events are sent before user leaves the page.
 *
 * @example
 * ```tsx
 * // In app layout or donation form
 * useBeforeUnload();
 * ```
 */
export function useBeforeUnload() {
  useEffect(() => {
    const handleBeforeUnload = () => {
      analytics.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      analytics.flush(); // Also flush on component unmount
    };
  }, []);
}

// ============================================================================
// useFormTracking - Form Field Tracking
// ============================================================================

/**
 * Track form field interactions
 *
 * Monitors form field focus, blur, and validation errors.
 * Useful for understanding where users struggle in donation forms.
 *
 * @example
 * ```tsx
 * const { trackFieldFocus, trackFieldError } = useFormTracking('donation-form');
 *
 * <input
 *   onFocus={() => trackFieldFocus('email')}
 *   onBlur={() => trackFieldBlur('email')}
 * />
 * ```
 */
export function useFormTracking(formId: string) {
  const { trackEvent } = useAnalytics();
  const fieldTimings = useRef<Record<string, number>>({});

  const trackFieldFocus = useCallback(
    (fieldName: string) => {
      fieldTimings.current[fieldName] = Date.now();
    },
    []
  );

  const trackFieldBlur = useCallback(
    (fieldName: string) => {
      const startTime = fieldTimings.current[fieldName];
      if (startTime) {
        const duration = Date.now() - startTime;
        delete fieldTimings.current[fieldName];

        // Track time spent on field (for UX analysis)
        if (duration > 1000) {
          // Only track if > 1 second
          console.log(`Field ${fieldName} interaction: ${duration}ms`);
        }
      }
    },
    []
  );

  const trackFieldError = useCallback(
    (fieldName: string, errorMessage: string) => {
      console.log(`Field error: ${fieldName} - ${errorMessage}`);
      // Could track validation errors for UX insights
    },
    []
  );

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldError,
  };
}

// ============================================================================
// usePerformanceTracking - Performance Monitoring
// ============================================================================

/**
 * Track performance metrics
 *
 * Monitors page load time, component render time, and API latency.
 *
 * @example
 * ```tsx
 * const { trackComponentRender, trackAPICall } = usePerformanceTracking();
 *
 * useEffect(() => {
 *   const start = performance.now();
 *   // ... do work
 *   trackComponentRender('DonationForm', performance.now() - start);
 * }, []);
 * ```
 */
export function usePerformanceTracking() {
  const trackComponentRender = useCallback(
    (componentName: string, duration: number) => {
      if (duration > 100) {
        // Only track slow renders
        console.log(`Component ${componentName} render: ${duration.toFixed(2)}ms`);
      }
    },
    []
  );

  const trackAPICall = useCallback(
    (endpoint: string, duration: number, success: boolean) => {
      console.log(`API ${endpoint}: ${duration.toFixed(2)}ms (${success ? 'success' : 'failed'})`);
    },
    []
  );

  const trackPageLoad = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Use Performance API to get page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (perfData) {
          const metrics = {
            dns: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp: perfData.connectEnd - perfData.connectStart,
            request: perfData.responseStart - perfData.requestStart,
            response: perfData.responseEnd - perfData.responseStart,
            dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            load: perfData.loadEventEnd - perfData.loadEventStart,
            total: perfData.loadEventEnd - perfData.fetchStart,
          };

          console.log('Page load metrics:', metrics);
        }
      }, 0);
    });
  }, []);

  useEffect(() => {
    trackPageLoad();
  }, [trackPageLoad]);

  return {
    trackComponentRender,
    trackAPICall,
    trackPageLoad,
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  useAnalytics,
  usePageTracking,
  useDonationFunnelTracking,
  useBeforeUnload,
  useFormTracking,
  usePerformanceTracking,
};

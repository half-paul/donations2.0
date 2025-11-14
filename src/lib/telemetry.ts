/**
 * OpenTelemetry Instrumentation
 *
 * Provides distributed tracing, metrics, and monitoring for the donation platform.
 * Tracks donation flow performance, API latency, and business KPIs.
 */

import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';

// ============================================================================
// Configuration
// ============================================================================

interface TelemetryConfig {
  serviceName: string;
  environment: string;
  enabled: boolean;
  exporterEndpoint?: string;
  sampleRate: number; // 0.0 to 1.0
}

const config: TelemetryConfig = {
  serviceName: process.env.OTEL_SERVICE_NAME || 'raisin-next',
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.OTEL_ENABLED === 'true',
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  sampleRate: parseFloat(process.env.OTEL_SAMPLE_RATE || '1.0'),
};

// ============================================================================
// Tracer Provider Setup
// ============================================================================

let tracerProvider: NodeTracerProvider | null = null;

/**
 * Initialize OpenTelemetry
 *
 * Call this once at application startup
 */
export function initializeTelemetry(): void {
  if (!config.enabled) {
    console.log('OpenTelemetry disabled');
    return;
  }

  // Create resource with service information
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
  });

  // Create tracer provider
  tracerProvider = new NodeTracerProvider({
    resource,
  });

  // Configure exporter
  if (config.exporterEndpoint) {
    const exporter = new OTLPTraceExporter({
      url: config.exporterEndpoint,
      headers: {
        'Authorization': `Bearer ${process.env.OTEL_EXPORTER_API_KEY || ''}`,
      },
    });

    tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
  } else {
    // Console exporter for development
    tracerProvider.addSpanProcessor(
      new SimpleSpanProcessor({
        export: (spans, resultCallback) => {
          console.log('Telemetry spans:', JSON.stringify(spans, null, 2));
          resultCallback({ code: 0 });
        },
        shutdown: async () => {},
      })
    );
  }

  // Register the provider
  tracerProvider.register();

  // Auto-instrumentation
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingPaths: ['/health', '/metrics'],
      }),
      new PrismaInstrumentation(),
    ],
  });

  console.log('OpenTelemetry initialized');
}

/**
 * Shutdown telemetry gracefully
 */
export async function shutdownTelemetry(): Promise<void> {
  if (tracerProvider) {
    await tracerProvider.shutdown();
    tracerProvider = null;
  }
}

// ============================================================================
// Tracer Instance
// ============================================================================

const tracer = trace.getTracer(config.serviceName, process.env.npm_package_version || '1.0.0');

// ============================================================================
// Span Creation Helpers
// ============================================================================

/**
 * Create a new span
 *
 * @example
 * ```ts
 * const span = createSpan('donation.create', { giftId: '123' });
 * try {
 *   // ... do work
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   recordError(span, error);
 * } finally {
 *   span.end();
 * }
 * ```
 */
export function createSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  return tracer.startSpan(name, {
    attributes: {
      ...attributes,
      'service.name': config.serviceName,
    },
  });
}

/**
 * Run a function within a new span
 *
 * Automatically handles span lifecycle and error recording
 *
 * @example
 * ```ts
 * const result = await withSpan('donation.process', async (span) => {
 *   span.setAttribute('gift.amount', amount);
 *   return await processGift(giftId);
 * });
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = createSpan(name, attributes);

  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    recordError(span, error);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Record an error on a span
 */
export function recordError(span: Span, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  span.recordException({
    name: error instanceof Error ? error.name : 'Error',
    message: errorMessage,
    stack: errorStack,
  });

  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: errorMessage,
  });
}

// ============================================================================
// Donation Flow Instrumentation
// ============================================================================

/**
 * Track donation creation flow
 *
 * Creates spans for the complete donation lifecycle:
 * - Payment processor call
 * - Database transaction
 * - Receipt generation
 * - Email delivery
 */
export async function traceDonationFlow<T>(
  operation: string,
  metadata: {
    giftId?: string;
    donorId?: string;
    campaignId?: string;
    amount?: number;
    currency?: string;
    processor?: string;
  },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return withSpan(
    `donation.${operation}`,
    async (span) => {
      // Add gift metadata as attributes
      if (metadata.giftId) span.setAttribute('gift.id', metadata.giftId);
      if (metadata.donorId) span.setAttribute('donor.id', metadata.donorId);
      if (metadata.campaignId) span.setAttribute('campaign.id', metadata.campaignId);
      if (metadata.amount) span.setAttribute('gift.amount', metadata.amount);
      if (metadata.currency) span.setAttribute('gift.currency', metadata.currency);
      if (metadata.processor) span.setAttribute('payment.processor', metadata.processor);

      return await fn(span);
    }
  );
}

/**
 * Track payment processor operations
 */
export async function tracePaymentOperation<T>(
  processor: string,
  operation: string,
  metadata: {
    amount?: number;
    currency?: string;
    paymentMethodType?: string;
  },
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return withSpan(
    `payment.${processor}.${operation}`,
    async (span) => {
      span.setAttribute('payment.processor', processor);
      if (metadata.amount) span.setAttribute('payment.amount', metadata.amount);
      if (metadata.currency) span.setAttribute('payment.currency', metadata.currency);
      if (metadata.paymentMethodType) {
        span.setAttribute('payment.method_type', metadata.paymentMethodType);
      }

      const startTime = Date.now();
      try {
        return await fn(span);
      } finally {
        const duration = Date.now() - startTime;
        span.setAttribute('payment.duration_ms', duration);
      }
    }
  );
}

/**
 * Track database operations
 */
export async function traceDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return withSpan(
    `db.${operation}`,
    async (span) => {
      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.table', table);
      span.setAttribute('db.operation', operation);

      return await fn(span);
    }
  );
}

/**
 * Track external API calls
 */
export async function traceAPICall<T>(
  service: string,
  endpoint: string,
  method: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return withSpan(
    `external.${service}.${endpoint}`,
    async (span) => {
      span.setAttribute('http.method', method);
      span.setAttribute('http.url', endpoint);
      span.setAttribute('external.service', service);

      const startTime = Date.now();
      try {
        return await fn(span);
      } finally {
        const duration = Date.now() - startTime;
        span.setAttribute('http.duration_ms', duration);
      }
    }
  );
}

// ============================================================================
// Business Metrics (Custom Metrics)
// ============================================================================

/**
 * Record a business metric
 *
 * These are high-level KPIs tracked separately from traces
 */
export function recordMetric(
  name: string,
  value: number,
  attributes?: Record<string, string>
): void {
  if (!config.enabled) return;

  // In production, this would use OpenTelemetry Metrics API
  // For now, we'll log to console
  console.log('Metric:', {
    name,
    value,
    attributes,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Record donation metrics
 */
export function recordDonationMetrics(
  giftId: string,
  metrics: {
    amount: number;
    currency: string;
    recurring: boolean;
    processor: string;
    processingTime: number; // milliseconds
    feeCovered: boolean;
  }
): void {
  const baseAttributes = {
    currency: metrics.currency,
    recurring: String(metrics.recurring),
    processor: metrics.processor,
    fee_covered: String(metrics.feeCovered),
  };

  recordMetric('donation.amount', metrics.amount, baseAttributes);
  recordMetric('donation.count', 1, baseAttributes);
  recordMetric('donation.processing_time', metrics.processingTime, baseAttributes);

  if (metrics.recurring) {
    recordMetric('donation.recurring.count', 1, baseAttributes);
  }

  if (metrics.feeCovered) {
    recordMetric('donation.fee_covered.count', 1, baseAttributes);
  }
}

/**
 * Record conversion funnel step
 */
export function recordFunnelStep(
  step: string,
  campaignId: string,
  sessionId: string
): void {
  recordMetric('funnel.step', 1, {
    step,
    campaign_id: campaignId,
    session_id: sessionId,
  });
}

/**
 * Record abandonment event
 */
export function recordAbandonment(
  step: string,
  campaignId: string,
  reason?: string
): void {
  recordMetric('funnel.abandonment', 1, {
    step,
    campaign_id: campaignId,
    reason: reason || 'unknown',
  });
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    return await fn();
  } finally {
    const duration = performance.now() - startTime;
    recordMetric('performance.duration_ms', duration, { operation: name });
  }
}

/**
 * Monitor API endpoint performance
 */
export function monitorEndpoint(endpoint: string) {
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    return withSpan(`api.${endpoint}`, async (span) => {
      span.setAttribute('http.route', endpoint);
      const startTime = Date.now();

      try {
        const result = await fn();
        span.setAttribute('http.status_code', 200);
        return result;
      } catch (error) {
        span.setAttribute('http.status_code', 500);
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        span.setAttribute('http.duration_ms', duration);
        recordMetric('api.latency_ms', duration, { endpoint });
      }
    });
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  initializeTelemetry,
  shutdownTelemetry,
  createSpan,
  withSpan,
  recordError,
  traceDonationFlow,
  tracePaymentOperation,
  traceDatabaseOperation,
  traceAPICall,
  recordMetric,
  recordDonationMetrics,
  recordFunnelStep,
  recordAbandonment,
  measurePerformance,
  monitorEndpoint,
};

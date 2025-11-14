/**
 * k6 Performance Test Configuration
 *
 * Load testing scenarios for the donation platform:
 * - Peak load: 500 donations/minute
 * - API latency p95 < 500ms
 * - Database connection pooling under load
 * - Memory leak detection
 */

export const options = {
  scenarios: {
    // Smoke test: Verify system works under minimal load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
      exec: 'donationFlow',
    },

    // Load test: Normal expected traffic
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },  // Ramp up to 50 users
        { duration: '5m', target: 50 },  // Stay at 50 for 5 minutes
        { duration: '2m', target: 100 }, // Ramp up to 100 users
        { duration: '5m', target: 100 }, // Stay at 100 for 5 minutes
        { duration: '2m', target: 0 },   // Ramp down to 0
      ],
      tags: { test_type: 'load' },
      exec: 'donationFlow',
    },

    // Stress test: Find system breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 0 },
      ],
      tags: { test_type: 'stress' },
      exec: 'donationFlow',
    },

    // Spike test: Sudden traffic surge
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 500 }, // Spike to 500 users
        { duration: '3m', target: 500 },
        { duration: '10s', target: 100 },
        { duration: '3m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
      exec: 'donationFlow',
    },

    // Soak test: Extended duration to find memory leaks
    soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      tags: { test_type: 'soak' },
      exec: 'donationFlow',
    },
  },

  thresholds: {
    // HTTP request duration
    http_req_duration: ['p(95)<500', 'p(99)<1000'],

    // HTTP request failure rate
    http_req_failed: ['rate<0.01'], // Less than 1% errors

    // Custom metrics
    'donation_completion_time': ['p(95)<8000'], // p95 < 8 seconds
    'donation_success_rate': ['rate>0.99'],     // >99% success rate
  },

  // Output results to file
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Environment configuration
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_URL = __ENV.API_URL || 'http://localhost:3000/api/trpc';

/**
 * k6 Load Test: Donation Flow
 *
 * Simulates realistic donation traffic patterns:
 * - One-time donations
 * - Recurring donation setup
 * - Donation retrieval
 * - Receipt generation
 *
 * Performance Targets:
 * - p95 < 8 seconds end-to-end
 * - p95 API latency < 500ms
 * - Error rate < 1%
 * - 500 donations/minute peak capacity
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { BASE_URL, API_URL, options } from './config.js';

// Custom metrics
const donationCompletionTime = new Trend('donation_completion_time');
const donationSuccessRate = new Rate('donation_success_rate');
const apiLatency = new Trend('api_latency');
const donationCounter = new Counter('donations_created');

// Test data generators
function generateDonor() {
  const timestamp = Date.now();
  return {
    donorEmail: `test.donor.${timestamp}@example.com`,
    firstName: 'Load',
    lastName: 'Test',
    phone: '+1-555-0100',
  };
}

function generateDonationAmount() {
  const amounts = [25, 50, 100, 250, 500, 1000];
  return amounts[Math.floor(Math.random() * amounts.length)];
}

// Main donation flow test
export function donationFlow() {
  const startTime = new Date();

  // Step 1: Load donation form page
  const formResponse = http.get(`${BASE_URL}/donate/annual-fund-2024`);

  check(formResponse, {
    'form page loaded': (r) => r.status === 200,
    'form page LCP < 2.5s': (r) => r.timings.duration < 2500,
  });

  sleep(1); // User reads form

  // Step 2: Create donation via tRPC API
  const donor = generateDonor();
  const amount = generateDonationAmount();

  const createPayload = JSON.stringify({
    donorEmail: donor.donorEmail,
    firstName: donor.firstName,
    lastName: donor.lastName,
    phone: donor.phone,
    amount: amount,
    currency: 'USD',
    donorCoversFee: Math.random() > 0.5, // 50% opt-in rate
  });

  const createHeaders = {
    'Content-Type': 'application/json',
  };

  const apiStart = new Date();
  const createResponse = http.post(
    `${API_URL}/donation.create`,
    createPayload,
    { headers: createHeaders }
  );
  const apiDuration = new Date() - apiStart;

  apiLatency.add(apiDuration);

  const createSuccess = check(createResponse, {
    'donation created': (r) => r.status === 200,
    'valid response': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.result && body.result.data;
      } catch {
        return false;
      }
    },
    'api latency < 500ms': (r) => r.timings.duration < 500,
  });

  if (!createSuccess) {
    donationSuccessRate.add(0);
    return;
  }

  const giftData = JSON.parse(createResponse.body).result.data;
  donationCounter.add(1);

  sleep(2); // Simulate payment processing time

  // Step 3: Simulate webhook update (payment success)
  const updatePayload = JSON.stringify({
    giftId: giftData.id,
    status: 'success',
    processorRef: `pi_test_${Date.now()}`,
    processorFee: amount * 0.029 + 0.30,
    completedAt: new Date().toISOString(),
  });

  const updateResponse = http.post(
    `${API_URL}/donation.update`,
    updatePayload,
    { headers: createHeaders }
  );

  check(updateResponse, {
    'donation updated': (r) => r.status === 200,
  });

  // Step 4: Retrieve donation details
  const getResponse = http.post(
    `${API_URL}/donation.getById`,
    JSON.stringify({ giftId: giftData.id }),
    { headers: createHeaders }
  );

  check(getResponse, {
    'donation retrieved': (r) => r.status === 200,
  });

  // Calculate total completion time
  const completionTime = new Date() - startTime;
  donationCompletionTime.add(completionTime);

  const success = check({ completionTime }, {
    'end-to-end < 8 seconds': (metrics) => metrics.completionTime < 8000,
  });

  donationSuccessRate.add(success ? 1 : 0);

  sleep(1);
}

// Recurring donation flow test
export function recurringFlow() {
  const donor = generateDonor();
  const amount = generateDonationAmount();

  const payload = JSON.stringify({
    donorEmail: donor.donorEmail,
    firstName: donor.firstName,
    lastName: donor.lastName,
    amount: amount,
    currency: 'USD',
    frequency: 'MONTHLY',
    nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    mandateId: `sub_test_${Date.now()}`,
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  const response = http.post(
    `${API_URL}/recurring.create`,
    payload,
    { headers }
  );

  check(response, {
    'recurring plan created': (r) => r.status === 200,
    'api latency < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

// Campaign page load test
export function campaignPageLoad() {
  const response = http.get(`${BASE_URL}/donate/annual-fund-2024`);

  check(response, {
    'page loaded': (r) => r.status === 200,
    'LCP < 2.5s': (r) => r.timings.duration < 2500,
  });

  sleep(1);
}

// Export functions for different scenarios
export default function () {
  const scenario = Math.random();

  if (scenario < 0.7) {
    // 70% one-time donations
    donationFlow();
  } else if (scenario < 0.9) {
    // 20% recurring donations
    recurringFlow();
  } else {
    // 10% just browsing
    campaignPageLoad();
  }
}

// Thresholds for pass/fail
export const thresholds = {
  'donation_completion_time{p(95)}': ['<8000'], // p95 < 8 seconds
  'donation_success_rate': ['rate>0.99'], // >99% success
  'api_latency{p(95)}': ['<500'], // p95 < 500ms
  'http_req_failed': ['rate<0.01'], // <1% errors
  'http_req_duration{p(95)}': ['<2500'], // p95 < 2.5s for all HTTP
};

/**
 * E2E Tests: Donation Flow
 *
 * Tests complete user journey for one-time donations:
 * - Navigate to donation form
 * - Fill out donor information
 * - Select donation amount
 * - Enter payment details
 * - Submit donation
 * - Verify confirmation page
 */

import { test, expect } from '@playwright/test';

test.describe('One-Time Donation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to donation page
    await page.goto('/donate/annual-fund-2024');

    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Support');
  });

  test('should complete donation with predefined amount', async ({ page }) => {
    // Step 1: Select amount ($100)
    await page.getByRole('button', { name: '$100' }).click();

    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Fill donor information
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Donor');
    await page.getByLabel('Email').fill('jane.donor@example.com');
    await page.getByLabel('Phone').fill('+1-555-0100');

    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Payment information (using Stripe test card)
    const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
    await stripeFrame.getByLabel('Card number').fill('4242424242424242');
    await stripeFrame.getByLabel('Expiry date').fill('12/34');
    await stripeFrame.getByLabel('CVC').fill('123');
    await stripeFrame.getByLabel('ZIP').fill('90210');

    // Step 4: Submit donation
    await page.getByRole('button', { name: 'Complete Donation' }).click();

    // Step 5: Verify confirmation
    await expect(page.locator('h1')).toContainText('Thank You', {
      timeout: 15000,
    });

    await expect(page.getByText('$100.00')).toBeVisible();
    await expect(page.getByText('jane.donor@example.com')).toBeVisible();

    // Verify receipt download link is available
    await expect(page.getByRole('link', { name: 'Download Receipt' })).toBeVisible();
  });

  test('should complete donation with custom amount', async ({ page }) => {
    // Step 1: Enter custom amount
    await page.getByRole('button', { name: 'Other Amount' }).click();
    await page.getByLabel('Custom Amount').fill('250.50');

    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Fill donor information
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Smith');
    await page.getByLabel('Email').fill('john.smith@example.com');

    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Payment
    const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
    await stripeFrame.getByLabel('Card number').fill('4242424242424242');
    await stripeFrame.getByLabel('Expiry date').fill('12/34');
    await stripeFrame.getByLabel('CVC').fill('123');
    await stripeFrame.getByLabel('ZIP').fill('10001');

    await page.getByRole('button', { name: 'Complete Donation' }).click();

    // Verify custom amount on confirmation
    await expect(page.getByText('$250.50')).toBeVisible();
  });

  test('should allow donor to cover processing fees', async ({ page }) => {
    // Step 1: Select amount and opt-in to cover fees
    await page.getByRole('button', { name: '$50' }).click();

    await page.getByLabel('Cover processing fees').check();

    // Verify fee amount is displayed
    await expect(page.getByText('$1.75')).toBeVisible(); // Stripe fee for $50

    // Verify total is updated
    await expect(page.getByText('Total: $51.75')).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();

    // Complete donation flow
    await page.getByLabel('First Name').fill('Alice');
    await page.getByLabel('Last Name').fill('Johnson');
    await page.getByLabel('Email').fill('alice@example.com');

    await page.getByRole('button', { name: 'Continue' }).click();

    const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
    await stripeFrame.getByLabel('Card number').fill('4242424242424242');
    await stripeFrame.getByLabel('Expiry date').fill('12/34');
    await stripeFrame.getByLabel('CVC').fill('123');
    await stripeFrame.getByLabel('ZIP').fill('90210');

    await page.getByRole('button', { name: 'Complete Donation' }).click();

    // Verify total charged includes fee
    await expect(page.getByText('$51.75')).toBeVisible();
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    // Step 1: Select amount
    await page.getByRole('button', { name: '$100' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Fill donor info
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Failure');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Use Stripe test card for declined payment
    const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
    await stripeFrame.getByLabel('Card number').fill('4000000000000002'); // Card declined
    await stripeFrame.getByLabel('Expiry date').fill('12/34');
    await stripeFrame.getByLabel('CVC').fill('123');
    await stripeFrame.getByLabel('ZIP').fill('90210');

    await page.getByRole('button', { name: 'Complete Donation' }).click();

    // Verify error message is displayed
    await expect(page.getByText(/card was declined/i)).toBeVisible();

    // Verify user can retry
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to proceed without selecting amount
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify validation error
    await expect(page.getByText(/select an amount/i)).toBeVisible();

    // Select amount and proceed
    await page.getByRole('button', { name: '$100' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Try to proceed without filling donor info
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify field validation
    await expect(page.getByText(/first name is required/i)).toBeVisible();
    await expect(page.getByText(/last name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test('should preserve form data on navigation back', async ({ page }) => {
    // Step 1: Fill amount
    await page.getByRole('button', { name: '$100' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Fill donor info
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Donor');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Navigate back
    await page.getByRole('button', { name: 'Back' }).click();

    // Verify donor info is preserved
    await expect(page.getByLabel('First Name')).toHaveValue('Jane');
    await expect(page.getByLabel('Last Name')).toHaveValue('Donor');
    await expect(page.getByLabel('Email')).toHaveValue('jane@example.com');

    // Navigate back to amount
    await page.getByRole('button', { name: 'Back' }).click();

    // Verify amount is still selected
    await expect(page.getByRole('button', { name: '$100' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('should track analytics events', async ({ page }) => {
    // Listen for analytics tracking calls
    const analyticsEvents: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/analytics/track')) {
        analyticsEvents.push(request.url());
      }
    });

    // Complete donation flow
    await page.getByRole('button', { name: '$100' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Donor');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
    await stripeFrame.getByLabel('Card number').fill('4242424242424242');
    await stripeFrame.getByLabel('Expiry date').fill('12/34');
    await stripeFrame.getByLabel('CVC').fill('123');
    await stripeFrame.getByLabel('ZIP').fill('90210');

    await page.getByRole('button', { name: 'Complete Donation' }).click();

    // Wait for completion
    await expect(page.locator('h1')).toContainText('Thank You');

    // Verify analytics events were tracked
    expect(analyticsEvents.length).toBeGreaterThan(0);
  });
});

test.describe('Donation Flow - Accessibility', () => {
  test('should be navigable with keyboard only', async ({ page }) => {
    await page.goto('/donate/annual-fund-2024');

    // Tab to first amount button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Select $100 with Enter
    await page.keyboard.press('Enter');

    // Tab to Continue button and press
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verify navigation to donor info step
    await expect(page.getByLabel('First Name')).toBeVisible();
  });

  test('should announce step changes to screen readers', async ({ page }) => {
    await page.goto('/donate/annual-fund-2024');

    // Check for ARIA live region
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeVisible();

    // Select amount and continue
    await page.getByRole('button', { name: '$100' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify step announcement
    await expect(liveRegion).toContainText(/step 2/i);
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/donate/annual-fund-2024');

    await page.getByRole('button', { name: '$100' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify focus is moved to first input on new step
    const firstNameInput = page.getByLabel('First Name');
    await expect(firstNameInput).toBeFocused();
  });
});

test.describe('Donation Flow - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should work on mobile viewport', async ({ page }) => {
    await page.goto('/donate/annual-fund-2024');

    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();

    // Complete donation on mobile
    await page.getByRole('button', { name: '$50' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.getByLabel('First Name').fill('Mobile');
    await page.getByLabel('Last Name').fill('Donor');
    await page.getByLabel('Email').fill('mobile@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Verify payment step renders correctly on mobile
    await expect(page.getByRole('heading', { name: /payment/i })).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/donate/annual-fund-2024');

    // Tap amount button
    await page.getByRole('button', { name: '$100' }).tap();

    // Verify selection
    await expect(page.getByRole('button', { name: '$100' })).toHaveAttribute('aria-pressed', 'true');
  });
});

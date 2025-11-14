# Testing Guide - Raisin Next

Comprehensive testing documentation for the Raisin Next donation platform.

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [Continuous Integration](#continuous-integration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Raisin Next platform implements a comprehensive testing strategy covering:

- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and database interaction testing
- **E2E Tests**: Complete user journey testing
- **Accessibility Tests**: WCAG 2.2 AA compliance validation
- **Performance Tests**: Load testing and performance regression detection
- **Security Tests**: Input validation and vulnerability scanning

### Testing Philosophy

Our testing approach follows these principles:

1. **Prevention over Detection**: Catch issues before they reach production
2. **Fast Feedback**: Tests run quickly to enable rapid iteration
3. **Clear Failures**: Test failures immediately indicate what broke and why
4. **Realistic Scenarios**: Test data mirrors production conditions
5. **Maintenance First**: Tests are easy to update as requirements evolve

### Coverage Targets

| Test Type | Target | Enforcement |
|-----------|--------|-------------|
| Line Coverage | 80% | CI/CD blocks on failure |
| Branch Coverage | 75% | CI/CD blocks on failure |
| Function Coverage | 80% | CI/CD blocks on failure |
| Critical Paths | 100% | Manual review required |
| E2E Coverage | All user stories | QA sign-off required |

---

## Test Infrastructure

### Technology Stack

- **Unit/Integration**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **E2E**: [Playwright](https://playwright.dev/) - Browser automation
- **Performance**: [k6](https://k6.io/) - Load testing
- **Accessibility**: [axe-core](https://github.com/dequelabs/axe-core) - a11y validation
- **Coverage**: [v8](https://v8.dev/blog/javascript-code-coverage) - Code coverage

### Configuration Files

```
donations2.0/
├── vitest.config.ts           # Unit/integration test config
├── playwright.config.ts        # E2E test config
├── k6/
│   └── config.js              # Performance test config
└── src/__tests__/
    └── setup.ts               # Global test setup
```

### Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                    # Global test setup
│   ├── fixtures/                   # Reusable test data
│   │   ├── donations.ts
│   │   └── sessions.ts
│   ├── server/
│   │   ├── routers/                # tRPC router tests
│   │   │   ├── donation.test.ts
│   │   │   ├── recurring.test.ts
│   │   │   ├── tribute.test.ts
│   │   │   ├── campaign.test.ts
│   │   │   ├── receipt.test.ts
│   │   │   └── audit.test.ts
│   │   ├── payments/               # Payment adapter tests
│   │   │   ├── stripe-adapter.test.ts
│   │   │   ├── adyen-adapter.test.ts
│   │   │   └── paypal-adapter.test.ts
│   │   └── middleware/             # Middleware tests
│   │       ├── rbac.test.ts
│   │       └── rate-limit.test.ts
│   ├── components/                 # Component tests
│   │   ├── donation-flow.test.tsx
│   │   └── auth-components.test.tsx
│   ├── integration/                # Integration tests
│   │   ├── donation-flow.test.ts
│   │   └── webhook-processing.test.ts
│   ├── a11y/                       # Accessibility tests
│   │   └── wcag-compliance.test.ts
│   └── security/                   # Security tests
│       └── input-validation.test.ts
└── e2e/                            # E2E tests
    ├── donation-flow.spec.ts
    ├── recurring-donation.spec.ts
    └── tribute-donation.spec.ts
```

---

## Running Tests

### Local Development

#### Run All Tests

```bash
# Run unit and integration tests
pnpm test

# Run tests in watch mode (recommended for development)
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

#### Run Specific Test Suites

```bash
# Run tests matching pattern
pnpm test donation

# Run specific test file
pnpm test src/__tests__/server/routers/donation.test.ts

# Run tests in specific directory
pnpm test src/__tests__/server/routers
```

#### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run E2E tests on specific browser
pnpm exec playwright test --project=chromium

# Run specific E2E test file
pnpm exec playwright test e2e/donation-flow.spec.ts

# Open Playwright UI mode for debugging
pnpm exec playwright test --ui
```

#### Performance Tests

```bash
# Install k6 (macOS)
brew install k6

# Run load test
k6 run k6/donation-load-test.js

# Run specific scenario
k6 run --env SCENARIO=smoke k6/donation-load-test.js

# Run with custom VUs and duration
k6 run --vus 100 --duration 5m k6/donation-load-test.js
```

#### Accessibility Tests

```bash
# Run accessibility tests
pnpm test src/__tests__/a11y

# Run with detailed output
pnpm test src/__tests__/a11y --reporter=verbose
```

#### Security Tests

```bash
# Run security tests
pnpm test src/__tests__/security

# Run npm audit
pnpm audit --production

# Check for outdated dependencies
pnpm outdated
```

### Database Setup for Tests

Tests require a PostgreSQL database. Use Docker for local testing:

```bash
# Start PostgreSQL container
docker run --name raisin-test-db \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=raisin_test \
  -p 5432:5432 \
  -d postgres:15

# Push Prisma schema
DATABASE_URL=postgresql://test:test@localhost:5432/raisin_test pnpm db:push

# Seed test data
DATABASE_URL=postgresql://test:test@localhost:5432/raisin_test pnpm db:seed
```

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
DATABASE_URL=postgresql://test:test@localhost:5432/raisin_test
NEXTAUTH_SECRET=test-secret-key-for-testing-only
NEXTAUTH_URL=http://localhost:3000

# Payment processors (test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
ADYEN_API_KEY=test_...
PAYPAL_CLIENT_ID=test_...
PAYPAL_CLIENT_SECRET=test_...
```

---

## Writing Tests

### Unit Test Example

```typescript
// src/__tests__/server/routers/donation.test.ts
import { describe, it, expect, vi } from 'vitest';
import { donationRouter } from '@/server/api/routers/donation';
import { mockDonor, mockGift } from '../../fixtures/donations';

describe('Donation Router', () => {
  describe('create', () => {
    it('should create a new donation', async () => {
      const ctx = createMockContext();

      // Arrange: Setup mocks
      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockGift),
          },
          audit: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      // Act: Call the procedure
      const caller = donationRouter.createCaller(ctx);
      const result = await caller.create({
        donorEmail: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD',
        donorCoversFee: false,
      });

      // Assert: Verify results
      expect(result).toBeDefined();
      expect(result.amount).toBe(100);
    });
  });
});
```

### E2E Test Example

```typescript
// e2e/donation-flow.spec.ts
import { test, expect } from '@playwright/test';

test('should complete donation with predefined amount', async ({ page }) => {
  // Navigate to donation page
  await page.goto('/donate/annual-fund-2024');

  // Select amount
  await page.getByRole('button', { name: '$100' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Fill donor information
  await page.getByLabel('First Name').fill('Jane');
  await page.getByLabel('Last Name').fill('Donor');
  await page.getByLabel('Email').fill('jane@example.com');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Fill payment details (Stripe test card)
  const stripeFrame = page.frameLocator('iframe[title="Secure payment input frame"]');
  await stripeFrame.getByLabel('Card number').fill('4242424242424242');
  await stripeFrame.getByLabel('Expiry date').fill('12/34');
  await stripeFrame.getByLabel('CVC').fill('123');

  // Submit donation
  await page.getByRole('button', { name: 'Complete Donation' }).click();

  // Verify confirmation
  await expect(page.locator('h1')).toContainText('Thank You', {
    timeout: 15000,
  });
});
```

### Component Test Example

```typescript
// src/__tests__/components/donation-flow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DonationFlow } from '@/components/donation/DonationFlow';

describe('DonationFlow', () => {
  it('should render amount selection step', () => {
    render(<DonationFlow campaignId="test-campaign" />);

    expect(screen.getByText('Select Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '$100' })).toBeInTheDocument();
  });

  it('should advance to donor info when amount selected', async () => {
    render(<DonationFlow campaignId="test-campaign" />);

    const amountButton = screen.getByRole('button', { name: '$100' });
    fireEvent.click(amountButton);

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(continueButton);

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });
});
```

### Accessibility Test Example

```typescript
// src/__tests__/a11y/donation-form.test.ts
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { createAxeInstance } from '../utils/axe-helper';

describe('Donation Form Accessibility', () => {
  it('should have no WCAG violations', async () => {
    const html = `
      <form aria-label="Donation form">
        <label for="amount">Amount</label>
        <input type="number" id="amount" name="amount" />
        <button type="submit">Donate</button>
      </form>
    `;

    const { document } = new JSDOM(html).window;
    const axe = await createAxeInstance();
    const results = await axe.run(document);

    expect(results.violations).toHaveLength(0);
  });
});
```

### Test Utilities and Helpers

#### Mock Context Creator

```typescript
// src/__tests__/utils/mock-context.ts
export function createMockContext(session: any = null) {
  return {
    db: mockDeep<PrismaClient>(),
    session,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  };
}
```

#### Test Data Builders

```typescript
// src/__tests__/fixtures/donations.ts
export function createMockGift(overrides?: Partial<Gift>): Gift {
  return {
    id: 'gift-test-001',
    donorId: 'donor-test-001',
    amount: 100.00,
    currency: 'USD',
    status: 'COMPLETED',
    ...overrides,
  };
}
```

---

## Test Coverage

### Viewing Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML coverage report
open coverage/index.html
```

### Coverage Requirements

All code must meet these minimum thresholds:

- **Lines**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Statements**: 80%

### Critical Paths (100% Coverage Required)

The following code paths require 100% test coverage:

1. **Payment Processing**:
   - Payment intent creation
   - Webhook processing
   - Refund handling
   - Fee calculation

2. **Authentication & Authorization**:
   - Login/logout flows
   - Session management
   - RBAC checks
   - Permission validation

3. **Data Integrity**:
   - Donation creation
   - Recurring plan management
   - Receipt generation
   - Audit logging

4. **Security**:
   - Input validation
   - CSRF protection
   - Rate limiting
   - SQL injection prevention

### Excluding Code from Coverage

Use `/* istanbul ignore next */` sparingly:

```typescript
// Only for unreachable error states
try {
  // Normal flow
} catch (error) {
  /* istanbul ignore next */
  // This should never happen due to validation
  console.error('Unexpected error:', error);
}
```

---

## Continuous Integration

### GitHub Actions Workflow

The CI/CD pipeline runs on every push and pull request:

1. **Unit Tests**: Vitest with coverage reporting
2. **E2E Tests**: Playwright across browsers
3. **Accessibility Tests**: axe-core validation
4. **Security Tests**: npm audit + OWASP checks
5. **Type Check**: TypeScript validation
6. **Lint**: ESLint verification
7. **Quality Gate**: All tests must pass

### Quality Gates

Pull requests are blocked if:

- Any test fails
- Coverage drops below thresholds
- TypeScript errors exist
- Linting errors exist
- Security vulnerabilities detected (high/critical)

### Test Results

Test results are uploaded as artifacts:

- **Coverage Report**: `coverage/index.html`
- **Playwright Report**: `playwright-report/index.html`
- **QA Sign-Off**: `qa-report.md`

Access artifacts from GitHub Actions run page.

---

## Troubleshooting

### Common Issues

#### Tests Fail Locally but Pass in CI

**Cause**: Environment differences

**Solution**:
```bash
# Use exact Node version from CI
nvm use 18

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear test database
docker rm -f raisin-test-db
```

#### Flaky E2E Tests

**Cause**: Race conditions, timing issues

**Solution**:
```typescript
// Bad: Fixed timeouts
await page.waitForTimeout(5000);

// Good: Wait for specific conditions
await expect(page.locator('h1')).toContainText('Thank You', {
  timeout: 15000,
});
```

#### Database Connection Errors

**Cause**: PostgreSQL not running or wrong credentials

**Solution**:
```bash
# Check PostgreSQL is running
docker ps | grep raisin-test-db

# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Coverage Not Generated

**Cause**: Missing coverage configuration

**Solution**:
```bash
# Ensure vitest.config.ts has coverage config
# Run with explicit coverage flag
pnpm vitest run --coverage
```

#### Playwright Browser Installation Fails

**Cause**: Missing system dependencies

**Solution**:
```bash
# Install system dependencies
pnpm exec playwright install-deps

# Reinstall browsers
pnpm exec playwright install
```

### Debugging Tests

#### Enable Verbose Logging

```bash
# Vitest verbose mode
pnpm test --reporter=verbose

# Playwright debug mode
DEBUG=pw:api pnpm test:e2e
```

#### Run Single Test

```bash
# Vitest: Use .only
it.only('should test this specific case', () => {
  // Test code
});

# Playwright: Use --grep
pnpm exec playwright test --grep "donation flow"
```

#### Inspect Test Database

```bash
# Open Prisma Studio
DATABASE_URL=postgresql://test:test@localhost:5432/raisin_test pnpm db:studio

# Query with psql
psql $DATABASE_URL
```

### Performance Test Issues

#### k6 Script Errors

```bash
# Validate script syntax
k6 inspect k6/donation-load-test.js

# Run with minimal load first
k6 run --vus 1 --duration 10s k6/donation-load-test.js
```

#### High Error Rates

**Possible Causes**:
- Application not running
- Database connection pool exhausted
- Rate limiting triggered

**Solution**:
```bash
# Check application logs
pnpm dev

# Increase database connection pool
# In prisma schema:
# datasource db {
#   connection_limit = 100
# }
```

---

## Best Practices

### DO

- Write tests for all new features
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both success and failure paths
- Use test fixtures for reusable data
- Keep tests isolated and independent
- Run tests before committing

### DON'T

- Skip tests to save time
- Test implementation details
- Use arbitrary timeouts
- Share state between tests
- Commit commented-out tests
- Ignore flaky tests
- Mock everything (integration tests)
- Use production data in tests

---

## Resources

### Documentation

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [k6 Docs](https://k6.io/docs/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

### Internal Documentation

- [Architecture Decision Records](./ADRs/)
- [API Documentation](./API.md)
- [Contributing Guide](../CONTRIBUTING.md)

---

## Getting Help

### Questions or Issues?

1. Check this documentation
2. Search existing issues on GitHub
3. Ask in team Slack channel: #engineering
4. Create a new GitHub issue with `testing` label

### Reporting Test Failures

When reporting test failures, include:

1. Test file and line number
2. Full error message
3. Environment (local, CI, staging)
4. Steps to reproduce
5. Expected vs. actual behavior

---

## Appendix

### Test Data Reference

#### Stripe Test Cards

| Card Number         | Behavior                 |
|---------------------|--------------------------|
| 4242424242424242    | Successful payment       |
| 4000000000000002    | Card declined            |
| 4000000000009995    | Insufficient funds       |
| 4000002500003155    | Requires authentication  |

#### Test User Accounts

| Email                    | Role      | Password    |
|--------------------------|-----------|-------------|
| admin@test.local         | ADMIN     | test-admin  |
| org.admin@test.local     | ORG_ADMIN | test-org    |
| user@test.local          | USER      | test-user   |

#### Test Campaigns

| Slug                | Status | Target Amount |
|---------------------|--------|---------------|
| annual-fund-2024    | ACTIVE | $100,000      |
| emergency-appeal    | ACTIVE | $50,000       |
| draft-campaign      | DRAFT  | $25,000       |

---

**Last Updated**: 2024-01-15
**Maintained By**: QA & Test Engineering Team

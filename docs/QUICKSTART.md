# Quick Start Guide: tRPC Routers

Get up and running with the Raisin Next tRPC API in minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- pnpm package manager (recommended)

## Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Configure database connection
# Edit .env.local and set DATABASE_URL
# Example: postgresql://user:password@localhost:5432/raisin_next

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed database with sample data
pnpm db:seed
```

## Environment Variables

Create `.env.local` with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/raisin_next"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# System Token (for webhooks)
SYSTEM_TOKEN="your-system-token-here"

# Payment Processor (optional for testing)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Start Development Server

```bash
pnpm dev
```

API will be available at `http://localhost:3000/api/trpc`

## Test the API

### Using tRPC Playground (Recommended)

1. Install tRPC DevTools:
```bash
pnpm add -D @trpc/devtools
```

2. Access playground at `http://localhost:3000/api/trpc-playground`

### Using curl

```bash
# Create a donation
curl -X POST http://localhost:3000/api/trpc/donation.create \
  -H "Content-Type: application/json" \
  -d '{
    "donorEmail": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "amount": 50,
    "currency": "USD",
    "donorCoversFee": true
  }'

# Get campaign by slug
curl http://localhost:3000/api/trpc/campaign.getBySlug?input='{"slug":"spring-appeal-2025"}'
```

### Using Frontend (React Query)

```typescript
// Setup tRPC client
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/api/root';

export const trpc = createTRPCReact<AppRouter>();

// Use in component
function DonationForm() {
  const createDonation = trpc.donation.create.useMutation();

  const handleSubmit = (data) => {
    createDonation.mutate({
      donorEmail: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      amount: parseFloat(data.amount),
      currency: 'USD',
      donorCoversFee: data.coverFee
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Common Tasks

### Create a Donation

```typescript
const gift = await trpc.donation.create.mutate({
  donorEmail: 'donor@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  amount: 100,
  currency: 'USD',
  campaignId: 'campaign-uuid-here',
  donorCoversFee: true,
  metadata: {
    utmSource: 'email',
    utmCampaign: 'spring2025'
  }
});
```

### Get Campaign with Progress

```typescript
const campaign = await trpc.campaign.getBySlug.query({
  slug: 'spring-appeal-2025'
});

console.log(campaign.progress.currentAmount);
console.log(campaign.progress.donorCount);
console.log(campaign.progress.progressPercentage);
```

### List Recurring Plans

```typescript
const { data } = trpc.recurring.list.useInfiniteQuery(
  { limit: 10, status: 'active' },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }
);
```

### Update Recurring Plan Amount

```typescript
await trpc.recurring.update.mutate({
  planId: 'plan-uuid-here',
  amount: 75
});
```

### Simulate Webhook (Update Donation Status)

```bash
curl -X POST http://localhost:3000/api/trpc/donation.update \
  -H "Authorization: Bearer YOUR_SYSTEM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "giftId": "gift-uuid-here",
    "status": "success",
    "processorRef": "ch_1234567890",
    "completedAt": "2025-11-13T10:00:00Z",
    "processorFee": 3.20
  }'
```

## Database Management

### View Data in Prisma Studio

```bash
pnpm db:studio
```

Opens GUI at `http://localhost:5555`

### Reset Database (Development Only!)

```bash
# WARNING: Deletes all data!
pnpm db:push --force-reset
pnpm db:seed
```

### Create New Migration

```bash
# After modifying prisma/schema.prisma
pnpm db:migrate --name add_new_field
```

## Testing

### Run Unit Tests

```bash
pnpm test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

### Generate Coverage Report

```bash
pnpm test:coverage
```

### Run E2E Tests

```bash
pnpm test:e2e
```

## Troubleshooting

### Issue: "Rate limit exceeded"

**Solution**: Wait 1 minute or increase rate limit in `src/server/api/trpc.ts`:
```typescript
export const rateLimitedProcedure = publicProcedure.use(rateLimit(100, 60000)); // Increase to 100/min
```

### Issue: "Duplicate donation detected"

**Solution**: Wait 5 minutes or change email/amount. Duplicate detection prevents accidental resubmissions.

### Issue: "Campaign not found"

**Solution**: Verify campaign exists and status is "active":
```bash
pnpm db:studio
# Navigate to Campaign table
```

### Issue: Database connection failed

**Solution**: Verify `DATABASE_URL` in `.env.local` is correct and PostgreSQL is running:
```bash
# Check PostgreSQL status
pg_isready

# Test connection
psql $DATABASE_URL
```

### Issue: Type errors in frontend

**Solution**: Regenerate Prisma client and restart dev server:
```bash
pnpm db:generate
pnpm dev
```

## Next Steps

1. **Read Full Documentation**: `/docs/TRPC-ROUTERS-README.md`
2. **Review Schema**: `/prisma/schema.prisma`
3. **Check PRD**: `/docs/PRD-donation-page.md`
4. **Explore Seed Data**: Run `pnpm db:studio` to see sample data
5. **Build Frontend**: Integrate tRPC queries/mutations in Next.js pages
6. **Set Up Authentication**: Configure NextAuth.js providers
7. **Implement Webhooks**: Add payment processor webhook handlers
8. **Deploy**: Follow deployment checklist in README

## Useful Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm type-check            # TypeScript validation

# Database
pnpm db:push               # Push schema changes (dev)
pnpm db:migrate            # Create migration
pnpm db:migrate:deploy     # Apply migrations (prod)
pnpm db:seed               # Seed database
pnpm db:studio             # Open Prisma Studio
pnpm db:generate           # Regenerate Prisma client

# Testing
pnpm test                  # Run unit tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Generate coverage report
pnpm test:e2e              # Run E2E tests
```

## Support

- **Documentation**: `/docs`
- **Schema Reference**: `/prisma/schema.prisma`
- **Implementation Summary**: `/docs/IMPLEMENTATION-SUMMARY.md`
- **Project Guide**: `/CLAUDE.md`

Happy coding! 🚀

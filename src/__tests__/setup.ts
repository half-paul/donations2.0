/**
 * Vitest Global Test Setup
 *
 * Configures test environment, mocks, and global utilities
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/raisin_test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock Prisma Client
vi.mock('@/server/db', () => ({
  db: mockDeep(),
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
  },
}));

// Mock telemetry
vi.mock('@/lib/telemetry', () => ({
  tracer: {
    startSpan: vi.fn(() => ({
      end: vi.fn(),
      setAttribute: vi.fn(),
      setStatus: vi.fn(),
    })),
  },
}));

beforeAll(() => {
  // Global setup
});

afterEach(() => {
  // Reset mocks after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Global teardown
  vi.restoreAllMocks();
});

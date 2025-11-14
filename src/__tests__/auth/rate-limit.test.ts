/**
 * Rate Limiting Tests
 *
 * Tests rate limiting, account lockout, and security controls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  checkRateLimit,
  recordFailedLogin,
  checkAccountLockout,
  resetFailedLoginAttempts,
  RATE_LIMITS,
  ACCOUNT_LOCKOUT,
} from '@/server/api/middleware/rate-limit';

describe('Rate Limiting System', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const ipAddress = '192.168.1.1';

      // Should not throw for first few requests
      expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).not.toThrow();
      expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).not.toThrow();
      expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).not.toThrow();
    });

    it('should block requests exceeding limit', () => {
      const ipAddress = '192.168.1.2';

      // Make requests up to limit
      for (let i = 0; i < RATE_LIMITS.auth.limit; i++) {
        expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).not.toThrow();
      }

      // Next request should be blocked
      expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).toThrow(TRPCError);
      expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).toThrow(/Rate limit exceeded/);
    });

    it('should reset after time window expires', () => {
      const ipAddress = '192.168.1.3';

      // Make requests up to limit
      for (let i = 0; i < RATE_LIMITS.auth.limit; i++) {
        checkRateLimit(ipAddress, RATE_LIMITS.auth);
      }

      // Mock time passing (advance by window duration)
      vi.useFakeTimers();
      vi.advanceTimersByTime(RATE_LIMITS.auth.windowMs + 1000);

      // Should allow requests again
      expect(() => checkRateLimit(ipAddress, RATE_LIMITS.auth)).not.toThrow();

      vi.useRealTimers();
    });
  });

  describe('Account Lockout', () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        user: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        audit: {
          create: vi.fn(),
        },
      };
    });

    describe('recordFailedLogin', () => {
      it('should increment failed login attempts', async () => {
        const email = 'user@example.com';
        const mockUser = {
          id: 'user-123',
          failedLoginAttempts: 2,
          lockedUntil: null,
        };

        mockDb.user.findUnique.mockResolvedValue(mockUser);
        mockDb.user.update.mockResolvedValue({});
        mockDb.audit.create.mockResolvedValue({});

        const ctx = {
          db: mockDb,
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
        };

        await recordFailedLogin(ctx as any, email);

        expect(mockDb.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email },
            data: expect.objectContaining({
              failedLoginAttempts: 3,
            }),
          })
        );
      });

      it('should lock account after max attempts', async () => {
        const email = 'user@example.com';
        const mockUser = {
          id: 'user-123',
          failedLoginAttempts: ACCOUNT_LOCKOUT.maxAttempts - 1,
          lockedUntil: null,
        };

        mockDb.user.findUnique.mockResolvedValue(mockUser);
        mockDb.user.update.mockResolvedValue({});
        mockDb.audit.create.mockResolvedValue({});

        const ctx = {
          db: mockDb,
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
        };

        await recordFailedLogin(ctx as any, email);

        expect(mockDb.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email },
            data: expect.objectContaining({
              failedLoginAttempts: ACCOUNT_LOCKOUT.maxAttempts,
              lockedUntil: expect.any(Date),
            }),
          })
        );
      });

      it('should not reveal if user does not exist', async () => {
        const email = 'nonexistent@example.com';
        mockDb.user.findUnique.mockResolvedValue(null);

        const ctx = { db: mockDb } as any;

        // Should not throw even if user doesn't exist
        await expect(recordFailedLogin(ctx, email)).resolves.not.toThrow();
        expect(mockDb.user.update).not.toHaveBeenCalled();
      });
    });

    describe('checkAccountLockout', () => {
      it('should throw error if account is locked', async () => {
        const email = 'locked@example.com';
        const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        mockDb.user.findUnique.mockResolvedValue({
          id: 'user-123',
          lockedUntil: futureDate,
          failedLoginAttempts: 5,
        });

        const ctx = { db: mockDb } as any;

        await expect(checkAccountLockout(ctx, email)).rejects.toThrow(TRPCError);
        await expect(checkAccountLockout(ctx, email)).rejects.toThrow(/Account is locked/);
      });

      it('should reset lockout if expired', async () => {
        const email = 'user@example.com';
        const pastDate = new Date(Date.now() - 1000); // 1 second ago

        mockDb.user.findUnique.mockResolvedValue({
          id: 'user-123',
          lockedUntil: pastDate,
          failedLoginAttempts: 5,
        });
        mockDb.user.update.mockResolvedValue({});

        const ctx = { db: mockDb } as any;

        await expect(checkAccountLockout(ctx, email)).resolves.not.toThrow();
        expect(mockDb.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email },
            data: {
              lockedUntil: null,
              failedLoginAttempts: 0,
            },
          })
        );
      });
    });

    describe('resetFailedLoginAttempts', () => {
      it('should reset attempts on successful login', async () => {
        const userId = 'user-123';
        mockDb.user.update.mockResolvedValue({});

        const ctx = {
          db: mockDb,
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
        };

        await resetFailedLoginAttempts(ctx as any, userId);

        expect(mockDb.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: userId },
            data: expect.objectContaining({
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: expect.any(Date),
              lastLoginIp: '192.168.1.1',
            }),
          })
        );
      });
    });
  });
});

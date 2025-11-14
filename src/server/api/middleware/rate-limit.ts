/**
 * Rate Limiting and Account Lockout System
 *
 * Implements:
 * - Rate limiting on authentication endpoints
 * - Account lockout after failed login attempts
 * - IP-based rate limiting
 * - Distributed rate limiting (Redis-ready)
 *
 * Security:
 * - 5 failed attempts → 15-minute lockout
 * - Rate limit: 10 requests/minute per IP for auth endpoints
 * - Rate limit: 100 requests/minute per IP for donation creation
 */

import { TRPCError } from '@trpc/server';
import type { Context } from '../trpc';

/**
 * In-memory rate limit store
 * Replace with Redis in production for distributed systems
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  auth: {
    limit: 10,        // 10 requests
    windowMs: 60000,  // per minute
  },
  donation: {
    limit: 100,        // 100 requests
    windowMs: 60000,   // per minute
  },
  api: {
    limit: 1000,       // 1000 requests
    windowMs: 60000,   // per minute
  },
} as const;

/**
 * Account lockout configuration
 */
export const ACCOUNT_LOCKOUT = {
  maxAttempts: 5,        // Max failed login attempts
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Check rate limit for an IP address
 *
 * @throws TRPCError if rate limit exceeded
 */
export function checkRateLimit(
  ipAddress: string | null,
  config: typeof RATE_LIMITS.auth
): void {
  const key = ipAddress ?? 'unknown';
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // Reset if window expired
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + config.windowMs };
    rateLimitStore.set(key, record);
  }

  record.count += 1;

  if (record.count > config.limit) {
    const secondsRemaining = Math.ceil((record.resetAt - now) / 1000);
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${secondsRemaining} seconds.`,
    });
  }
}

/**
 * Record a failed login attempt
 *
 * Increments failedLoginAttempts and locks account if threshold exceeded.
 */
export async function recordFailedLogin(
  ctx: Context,
  email: string
): Promise<void> {
  try {
    const user = await ctx.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      // User doesn't exist, but don't reveal this (security)
      return;
    }

    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= ACCOUNT_LOCKOUT.maxAttempts;

    await ctx.db.user.update({
      where: { email },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + ACCOUNT_LOCKOUT.lockoutDurationMs)
          : null,
      },
    });

    // Audit log: failed login attempt
    await ctx.db.audit.create({
      data: {
        actor: user.id,
        action: 'READ',
        resource: `user:${user.id}`,
        diffs: {
          event: 'failed_login',
          attempts: newAttempts,
          locked: shouldLock,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    });

    // Log security event if account is locked
    if (shouldLock) {
      console.warn(`Account locked due to failed login attempts: ${email}`);

      // TODO: Send email notification to user about account lockout
      // await sendAccountLockedEmail(email);
    }
  } catch (error) {
    console.error('Failed to record login attempt:', error);
  }
}

/**
 * Check if an account is locked
 *
 * @throws TRPCError if account is locked
 */
export async function checkAccountLockout(
  ctx: Context,
  email: string
): Promise<void> {
  try {
    const user = await ctx.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    });

    if (!user) {
      // User doesn't exist, but don't reveal this
      return;
    }

    if (user.lockedUntil) {
      const now = new Date();
      if (user.lockedUntil > now) {
        const minutesRemaining = Math.ceil(
          (user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)
        );

        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Account is locked due to too many failed login attempts. Please try again in ${minutesRemaining} minutes.`,
        });
      } else {
        // Lock period expired, reset
        await ctx.db.user.update({
          where: { email },
          data: {
            lockedUntil: null,
            failedLoginAttempts: 0,
          },
        });
      }
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    console.error('Failed to check account lockout:', error);
  }
}

/**
 * Reset failed login attempts (on successful login)
 */
export async function resetFailedLoginAttempts(
  ctx: Context,
  userId: string
): Promise<void> {
  try {
    await ctx.db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ctx.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to reset login attempts:', error);
  }
}

/**
 * Cleanup expired rate limit records
 * Run periodically (e.g., every 5 minutes)
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}

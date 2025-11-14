/**
 * tRPC Configuration
 *
 * Defines the tRPC context, middleware, and procedure builders.
 * Implements authentication, RBAC, audit logging, and rate limiting.
 */

import { TRPCError, initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { PrismaClient, UserRole } from '@prisma/client';

// Initialize Prisma client (singleton pattern)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth';
import type { Session } from 'next-auth';

/**
 * Context creation
 *
 * Includes:
 * - Database client
 * - User session (if authenticated)
 * - Request metadata (IP, user agent)
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get session from NextAuth
  const session = await getServerSession(req, res, authOptions) as Session | null;

  // Extract request metadata
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]
    ?? req.headers['x-real-ip'] as string
    ?? req.socket.remoteAddress
    ?? null;

  const userAgent = req.headers['user-agent'] ?? null;

  return {
    db,
    session,
    req,
    res,
    ipAddress,
    userAgent,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Public procedure (no authentication required)
 * Used for donation creation, campaign lookup, etc.
 */
export const publicProcedure = t.procedure;

/**
 * Rate limiting middleware
 *
 * Prevents abuse by limiting requests per IP address.
 * Uses in-memory store (replace with Redis for production).
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (limit: number, windowMs: number) =>
  t.middleware(async ({ ctx, next }) => {
    const key = ctx.ipAddress ?? 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count += 1;

    if (record.count > limit) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds.`,
      });
    }

    return next({ ctx });
  });

/**
 * Rate-limited procedure for donation creation
 * 10 requests per minute per IP
 */
export const rateLimitedProcedure = publicProcedure.use(rateLimit(10, 60000));

/**
 * Authentication middleware
 *
 * Verifies that user is authenticated.
 * Throws UNAUTHORIZED if no session.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session, // Type-narrowed session
    },
  });
});

/**
 * Protected procedure (requires authentication)
 */
export const protectedProcedure = t.procedure.use(enforceAuth);

/**
 * RBAC middleware factory
 *
 * Checks if user has required role.
 */
const enforceRole = (allowedRoles: UserRole[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
    }

    return next({ ctx });
  });

/**
 * Platform admin-only procedure
 */
export const platformAdminProcedure = t.procedure.use(enforceRole([UserRole.platform_admin]));

/**
 * Admin procedure (org_admin, finance_admin, platform_admin)
 */
export const adminProcedure = t.procedure.use(
  enforceRole([UserRole.org_admin, UserRole.finance_admin, UserRole.platform_admin])
);

/**
 * Finance admin procedure
 */
export const financeProcedure = t.procedure.use(
  enforceRole([UserRole.finance_admin, UserRole.platform_admin])
);

/**
 * Support agent procedure
 */
export const supportProcedure = t.procedure.use(
  enforceRole([UserRole.support_agent, UserRole.platform_admin])
);

/**
 * System/webhook procedure
 *
 * For internal operations triggered by webhooks or scheduled jobs.
 * Verifies system token in Authorization header.
 */
const enforceSystem = t.middleware(({ ctx, next }) => {
  const authHeader = ctx.req.headers.authorization;
  const systemToken = process.env.SYSTEM_TOKEN;

  if (!systemToken) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'System token not configured.',
    });
  }

  if (authHeader !== `Bearer ${systemToken}`) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid system token.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      actor: 'system',
    },
  });
});

/**
 * System procedure (for webhooks and internal operations)
 */
export const systemProcedure = t.procedure.use(enforceSystem);

/**
 * Audit logging middleware
 *
 * Automatically logs all mutations to the audit table.
 * Captures actor, action, resource, and diffs.
 */
const auditLog = t.middleware(async ({ ctx, next, path, type, input }) => {
  const result = await next({ ctx });

  // Only log mutations (not queries)
  if (type === 'mutation') {
    try {
      const actor = ctx.session?.user?.id ?? 'anonymous';

      // Extract resource from result if available
      const resource = extractResourceFromResult(path, result.data);

      await ctx.db.audit.create({
        data: {
          actor,
          action: determineAction(path),
          resource: resource ?? `${path}:unknown`,
          diffs: sanitizeDiffs(input, result.data),
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', error);
    }
  }

  return result;
});

/**
 * Helper: Extract resource identifier from result
 */
function extractResourceFromResult(path: string, data: any): string | null {
  if (!data) return null;

  // Handle different return types
  if (data.id) {
    const resourceType = path.split('.')[0]; // e.g., "donation" from "donation.create"
    return `${resourceType}:${data.id}`;
  }

  return null;
}

/**
 * Helper: Determine audit action from procedure path
 */
function determineAction(path: string): 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' {
  if (path.includes('create')) return 'CREATE';
  if (path.includes('update') || path.includes('pause') || path.includes('cancel')) return 'UPDATE';
  if (path.includes('delete')) return 'DELETE';
  return 'READ';
}

/**
 * Helper: Sanitize diffs to exclude PII
 *
 * Removes sensitive fields from audit logs.
 */
function sanitizeDiffs(input: any, output: any): any {
  const sensitiveFields = [
    'email', 'phone', 'street1', 'street2',
    'city', 'state', 'zip', 'firstName', 'lastName',
    'recipientEmail', 'recipientName', 'honoreeName',
    'processorRef', 'mandateId'
  ];

  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  return {
    input: sanitize(input),
    output: output ? { id: output.id, status: output.status } : null,
  };
}

/**
 * Audited procedure (automatically logs mutations)
 */
export const auditedProcedure = publicProcedure.use(auditLog);

/**
 * Router creator
 */
export const createTRPCRouter = t.router;

/**
 * Middleware composer
 */
export const middleware = t.middleware;

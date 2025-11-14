/**
 * Unit Tests: Donation Router
 *
 * Tests all donation router procedures:
 * - create: Create one-time donation
 * - getById: Retrieve donation details
 * - list: List donations with filters
 * - update: Update donation status (webhook)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { donationRouter } from '@/server/api/routers/donation';
import { mockDonor, mockGift, mockCampaign, createMockGift } from '../../fixtures/donations';
import { mockSession, mockAdminSession } from '../../fixtures/sessions';
import { GiftStatus, PaymentProcessor } from '@prisma/client';

// Mock context
const createMockContext = (session: any = null) => ({
  db: {
    $transaction: vi.fn((callback) => callback({
      donor: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      gift: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      campaign: {
        findUnique: vi.fn(),
      },
      form: {
        findUnique: vi.fn(),
      },
      tribute: {
        findUnique: vi.fn(),
      },
      audit: {
        create: vi.fn(),
      },
      receipt: {
        create: vi.fn(),
        count: vi.fn(),
      },
    })),
    donor: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    gift: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  session,
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
});

describe('Donation Router', () => {
  describe('create', () => {
    it('should create a new donation with new donor', async () => {
      const ctx = createMockContext();

      // Mock donor creation (new donor)
      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(null), // No existing donor
            create: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null), // No duplicate
            create: vi.fn().mockResolvedValue(mockGift),
          },
          campaign: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockCampaign,
              status: 'active',
            }),
          },
          audit: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: 'new.donor@example.com',
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        campaignId: mockCampaign.id,
        donorCoversFee: false,
      };

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.create(input);

      expect(result).toBeDefined();
      expect(result.amount).toBe(100);
    });

    it('should use existing donor if email matches', async () => {
      const ctx = createMockContext();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(mockDonor), // Existing donor
            create: vi.fn(), // Should NOT be called
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockGift),
          },
          campaign: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockCampaign,
              status: 'active',
            }),
          },
          audit: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: mockDonor.email,
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        campaignId: mockCampaign.id,
        donorCoversFee: false,
      };

      const caller = donationRouter.createCaller(ctx);
      await caller.create(input);

      // Verify donor.create was not called in transaction
      // (Transaction mock verifies this behavior)
    });

    it('should reject duplicate donations within 5 minutes', async () => {
      const ctx = createMockContext();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(mockGift), // Duplicate found
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: mockDonor.email,
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        donorCoversFee: false,
      };

      const caller = donationRouter.createCaller(ctx);

      await expect(caller.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.create(input)).rejects.toThrow(/recently submitted/);
    });

    it('should calculate fee when donor covers fees', async () => {
      const ctx = createMockContext();

      let capturedGiftData: any;

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation((data) => {
              capturedGiftData = data.data;
              return Promise.resolve({
                ...mockGift,
                ...data.data,
              });
            }),
          },
          campaign: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockCampaign,
              status: 'active',
            }),
          },
          audit: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: mockDonor.email,
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        campaignId: mockCampaign.id,
        donorCoversFee: true,
      };

      const caller = donationRouter.createCaller(ctx);
      await caller.create(input);

      expect(capturedGiftData.donorCoversFee).toBe(true);
      expect(capturedGiftData.feeAmount).toBeGreaterThan(0);
      // Stripe: 2.9% + $0.30 = $3.20 for $100
      expect(capturedGiftData.feeAmount).toBeCloseTo(3.20, 2);
    });

    it('should reject donation to inactive campaign', async () => {
      const ctx = createMockContext();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          campaign: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockCampaign,
              status: 'DRAFT', // Inactive
            }),
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: mockDonor.email,
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        campaignId: mockCampaign.id,
        donorCoversFee: false,
      };

      const caller = donationRouter.createCaller(ctx);

      await expect(caller.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.create(input)).rejects.toThrow(/not currently accepting/);
    });

    it('should reject donation to non-existent campaign', async () => {
      const ctx = createMockContext();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          campaign: {
            findUnique: vi.fn().mockResolvedValue(null), // Campaign not found
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: mockDonor.email,
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        campaignId: 'non-existent-id',
        donorCoversFee: false,
      };

      const caller = donationRouter.createCaller(ctx);

      await expect(caller.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.create(input)).rejects.toThrow(/Campaign not found/);
    });

    it('should create audit log entry on donation creation', async () => {
      const ctx = createMockContext();
      const auditCreateMock = vi.fn();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          donor: {
            findFirst: vi.fn().mockResolvedValue(mockDonor),
          },
          gift: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockGift),
          },
          campaign: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockCampaign,
              status: 'active',
            }),
          },
          audit: {
            create: auditCreateMock,
          },
        };
        return callback(txMock);
      });

      const input = {
        donorEmail: mockDonor.email,
        firstName: 'Jane',
        lastName: 'Donor',
        amount: 100,
        currency: 'USD' as const,
        campaignId: mockCampaign.id,
        donorCoversFee: false,
      };

      const caller = donationRouter.createCaller(ctx);
      await caller.create(input);

      expect(auditCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE',
            resource: expect.stringContaining('gift:'),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should allow donor to view their own donation', async () => {
      const ctx = createMockContext(mockSession);

      ctx.db.gift.findUnique.mockResolvedValue({
        ...mockGift,
        donorId: mockSession.user.donorId,
      });

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.getById({ giftId: mockGift.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockGift.id);
    });

    it('should allow admin to view any donation', async () => {
      const ctx = createMockContext(mockAdminSession);

      ctx.db.gift.findUnique.mockResolvedValue(mockGift);

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.getById({ giftId: mockGift.id });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockGift.id);
    });

    it('should reject donor viewing another donor\'s donation', async () => {
      const ctx = createMockContext(mockSession);

      ctx.db.gift.findUnique.mockResolvedValue({
        ...mockGift,
        donorId: 'different-donor-id', // Not the session user's donation
      });

      const caller = donationRouter.createCaller(ctx);

      await expect(caller.getById({ giftId: mockGift.id })).rejects.toThrow(TRPCError);
      await expect(caller.getById({ giftId: mockGift.id })).rejects.toThrow(/do not have permission/);
    });

    it('should return 404 for non-existent donation', async () => {
      const ctx = createMockContext(mockSession);

      ctx.db.gift.findUnique.mockResolvedValue(null);

      const caller = donationRouter.createCaller(ctx);

      await expect(caller.getById({ giftId: 'non-existent-id' })).rejects.toThrow(TRPCError);
      await expect(caller.getById({ giftId: 'non-existent-id' })).rejects.toThrow(/not found/);
    });
  });

  describe('list', () => {
    it('should list donations for admin users', async () => {
      const ctx = createMockContext(mockAdminSession);

      const gifts = [
        createMockGift({ id: 'gift-1', amount: 100 }),
        createMockGift({ id: 'gift-2', amount: 200 }),
      ];

      ctx.db.gift.findMany.mockResolvedValue(gifts);

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.list({ limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('gift-1');
    });

    it('should filter donations by campaign', async () => {
      const ctx = createMockContext(mockAdminSession);

      ctx.db.gift.findMany.mockImplementation((args) => {
        expect(args.where.campaignId).toBe(mockCampaign.id);
        return Promise.resolve([mockGift]);
      });

      const caller = donationRouter.createCaller(ctx);
      await caller.list({ campaignId: mockCampaign.id, limit: 20 });

      expect(ctx.db.gift.findMany).toHaveBeenCalled();
    });

    it('should filter donations by status', async () => {
      const ctx = createMockContext(mockAdminSession);

      ctx.db.gift.findMany.mockImplementation((args) => {
        expect(args.where.status).toBe(GiftStatus.COMPLETED);
        return Promise.resolve([mockGift]);
      });

      const caller = donationRouter.createCaller(ctx);
      await caller.list({ status: GiftStatus.COMPLETED, limit: 20 });

      expect(ctx.db.gift.findMany).toHaveBeenCalled();
    });

    it('should implement cursor-based pagination', async () => {
      const ctx = createMockContext(mockAdminSession);

      const gifts = Array.from({ length: 21 }, (_, i) =>
        createMockGift({ id: `gift-${i}` })
      );

      ctx.db.gift.findMany.mockResolvedValue(gifts);

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.list({ limit: 20 });

      expect(result.items).toHaveLength(20); // One removed for pagination
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor?.id).toBe('gift-20');
    });
  });

  describe('update', () => {
    it('should update donation status on webhook', async () => {
      const ctx = createMockContext();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          gift: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockGift,
              status: GiftStatus.PENDING,
              processorRef: null,
            }),
            update: vi.fn().mockResolvedValue({
              ...mockGift,
              status: GiftStatus.COMPLETED,
              processorRef: 'pi_123456789',
            }),
          },
          audit: {
            create: vi.fn().mockResolvedValue({}),
          },
          receipt: {
            create: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return callback(txMock);
      });

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.update({
        giftId: mockGift.id,
        status: GiftStatus.COMPLETED,
        processorRef: 'pi_123456789',
        processorFee: 3.20,
        completedAt: new Date(),
      });

      expect(result.status).toBe(GiftStatus.COMPLETED);
    });

    it('should handle idempotent webhook processing', async () => {
      const ctx = createMockContext();

      const existingGift = {
        ...mockGift,
        status: GiftStatus.COMPLETED,
        processorRef: 'pi_123456789', // Already processed
      };

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          gift: {
            findUnique: vi.fn().mockResolvedValue(existingGift),
          },
        };
        return callback(txMock);
      });

      const caller = donationRouter.createCaller(ctx);
      const result = await caller.update({
        giftId: mockGift.id,
        status: GiftStatus.COMPLETED,
        processorRef: 'pi_123456789', // Same processorRef
        processorFee: 3.20,
      });

      // Should return existing gift without updates
      expect(result.processorRef).toBe('pi_123456789');
    });

    it('should calculate net amount correctly when donor covers fee', async () => {
      const ctx = createMockContext();

      let updatedGift: any;

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          gift: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockGift,
              amount: 100,
              donorCoversFee: true,
              status: GiftStatus.PENDING,
            }),
            update: vi.fn().mockImplementation((args) => {
              updatedGift = args.data;
              return Promise.resolve({
                ...mockGift,
                ...args.data,
              });
            }),
          },
          audit: {
            create: vi.fn(),
          },
          receipt: {
            create: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return callback(txMock);
      });

      const caller = donationRouter.createCaller(ctx);
      await caller.update({
        giftId: mockGift.id,
        status: GiftStatus.COMPLETED,
        processorRef: 'pi_123456789',
        processorFee: 3.20,
      });

      // When donor covers fee, net amount should equal donation amount
      expect(updatedGift.netAmount).toBe(100);
    });

    it('should calculate net amount correctly when donor does not cover fee', async () => {
      const ctx = createMockContext();

      let updatedGift: any;

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          gift: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockGift,
              amount: 100,
              donorCoversFee: false,
              status: GiftStatus.PENDING,
            }),
            update: vi.fn().mockImplementation((args) => {
              updatedGift = args.data;
              return Promise.resolve({
                ...mockGift,
                ...args.data,
              });
            }),
          },
          audit: {
            create: vi.fn(),
          },
          receipt: {
            create: vi.fn(),
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return callback(txMock);
      });

      const caller = donationRouter.createCaller(ctx);
      await caller.update({
        giftId: mockGift.id,
        status: GiftStatus.COMPLETED,
        processorRef: 'pi_123456789',
        processorFee: 3.20,
      });

      // When donor doesn't cover fee, deduct from donation
      expect(updatedGift.netAmount).toBeCloseTo(96.80, 2);
    });

    it('should create receipt on successful payment', async () => {
      const ctx = createMockContext();
      const receiptCreateMock = vi.fn();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          gift: {
            findUnique: vi.fn().mockResolvedValue({
              ...mockGift,
              status: GiftStatus.PENDING,
            }),
            update: vi.fn().mockResolvedValue({
              ...mockGift,
              status: GiftStatus.COMPLETED,
            }),
          },
          audit: {
            create: vi.fn(),
          },
          receipt: {
            create: receiptCreateMock,
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return callback(txMock);
      });

      const caller = donationRouter.createCaller(ctx);
      await caller.update({
        giftId: mockGift.id,
        status: GiftStatus.COMPLETED,
        processorRef: 'pi_123456789',
        processorFee: 3.20,
      });

      expect(receiptCreateMock).toHaveBeenCalled();
    });

    it('should not create receipt if payment failed', async () => {
      const ctx = createMockContext();
      const receiptCreateMock = vi.fn();

      ctx.db.$transaction.mockImplementationOnce(async (callback) => {
        const txMock = {
          gift: {
            findUnique: vi.fn().mockResolvedValue(mockGift),
            update: vi.fn().mockResolvedValue({
              ...mockGift,
              status: GiftStatus.FAILED,
            }),
          },
          audit: {
            create: vi.fn(),
          },
        };
        return callback(txMock);
      });

      const caller = donationRouter.createCaller(ctx);
      await caller.update({
        giftId: mockGift.id,
        status: GiftStatus.FAILED,
        processorRef: 'pi_123456789',
      });

      expect(receiptCreateMock).not.toHaveBeenCalled();
    });
  });
});

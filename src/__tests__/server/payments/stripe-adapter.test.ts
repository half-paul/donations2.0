/**
 * Unit Tests: Stripe Payment Adapter
 *
 * Tests Stripe-specific payment processing:
 * - Payment intent creation
 * - Payment confirmation
 * - Webhook signature verification
 * - Error handling
 * - Idempotency
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeAdapter } from '@/server/payments/stripe-adapter';

// Mock Stripe SDK
const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => mockStripe),
  };
});

describe('StripeAdapter', () => {
  let adapter: StripeAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new StripeAdapter({
      apiKey: 'sk_test_123',
      webhookSecret: 'whsec_test_123',
    });
  });

  describe('createPayment', () => {
    it('should create a payment intent with correct amount', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
        amount: 10000, // $100.00 in cents
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await adapter.createPayment({
        amount: 100.00,
        currency: 'USD',
        giftId: 'gift-test-001',
        donorEmail: 'test@example.com',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000, // Cents
          currency: 'usd',
        })
      );

      expect(result).toEqual({
        id: 'pi_test_123',
        clientSecret: 'pi_test_123_secret',
        status: 'pending',
      });
    });

    it('should use idempotency key to prevent duplicate charges', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      await adapter.createPayment({
        amount: 100.00,
        currency: 'USD',
        giftId: 'gift-test-001',
        donorEmail: 'test@example.com',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotency_key: expect.stringContaining('gift-test-001'),
        })
      );
    });

    it('should include metadata for tracking', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'secret',
        status: 'requires_payment_method',
      });

      await adapter.createPayment({
        amount: 100.00,
        currency: 'USD',
        giftId: 'gift-test-001',
        donorEmail: 'test@example.com',
        metadata: {
          campaignId: 'campaign-001',
          formId: 'form-001',
        },
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            giftId: 'gift-test-001',
            campaignId: 'campaign-001',
            formId: 'form-001',
          }),
        })
      );
    });

    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue({
        type: 'StripeCardError',
        code: 'card_declined',
        message: 'Your card was declined',
      });

      await expect(
        adapter.createPayment({
          amount: 100.00,
          currency: 'USD',
          giftId: 'gift-test-001',
          donorEmail: 'test@example.com',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyWebhook', () => {
    it('should verify webhook signature correctly', () => {
      const payload = JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      });

      const signature = 'test-signature';

      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = adapter.verifyWebhook(payload, signature);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_123'
      );

      expect(result).toEqual(mockEvent);
    });

    it('should reject invalid webhook signatures', () => {
      const payload = '{"type":"test"}';
      const signature = 'invalid-signature';

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => adapter.verifyWebhook(payload, signature)).toThrow();
    });
  });

  describe('getPaymentStatus', () => {
    it('should retrieve payment intent status', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10000,
        charges: {
          data: [
            {
              balance_transaction: {
                fee: 320, // $3.20 in cents
              },
            },
          ],
        },
      });

      const result = await adapter.getPaymentStatus('pi_test_123');

      expect(result).toEqual({
        id: 'pi_test_123',
        status: 'succeeded',
        processorFee: 3.20,
      });
    });

    it('should handle failed payment status', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_payment_method',
        last_payment_error: {
          message: 'Card declined',
        },
      });

      const result = await adapter.getPaymentStatus('pi_test_123');

      expect(result.status).toBe('failed');
    });
  });

  describe('fee calculation', () => {
    it('should calculate Stripe fees correctly', () => {
      const fee = adapter.calculateFee(100.00);

      // Stripe: 2.9% + $0.30
      // $100 * 0.029 + $0.30 = $3.20
      expect(fee).toBeCloseTo(3.20, 2);
    });

    it('should handle small amounts correctly', () => {
      const fee = adapter.calculateFee(5.00);

      // $5.00 * 0.029 + $0.30 = $0.445
      expect(fee).toBeCloseTo(0.45, 2);
    });

    it('should handle large amounts correctly', () => {
      const fee = adapter.calculateFee(10000.00);

      // $10,000 * 0.029 + $0.30 = $290.30
      expect(fee).toBeCloseTo(290.30, 2);
    });
  });

  describe('PCI compliance', () => {
    it('should never log or store full card numbers', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'secret',
        status: 'requires_payment_method',
      });

      await adapter.createPayment({
        amount: 100.00,
        currency: 'USD',
        giftId: 'gift-test-001',
        donorEmail: 'test@example.com',
      });

      // Verify no card numbers in logs
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/\d{16}/)
      );
    });

    it('should only use tokenized payment methods', async () => {
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'secret',
        status: 'requires_payment_method',
      });

      await adapter.createPayment({
        amount: 100.00,
        currency: 'USD',
        giftId: 'gift-test-001',
        donorEmail: 'test@example.com',
      });

      // Verify payment method is not inline (uses client-side tokenization)
      const callArgs = mockStripe.paymentIntents.create.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('payment_method_data.card');
    });
  });
});

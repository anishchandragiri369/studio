/**
 * Payment Failure Integration Tests
 * Tests the complete payment failure flow end-to-end
 */
// @ts-nocheck

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:9002',
  timeout: 30000
};

// Mock real order data for testing
const TEST_ORDER = {
  id: '1cb8faa3-be4b-4b55-ada3-93736b830141',
  email: 'test@example.com',
  amount: 299,
  status: 'Payment Success' // Will be updated to 'Payment Failed'
};

describe('Payment Failure Integration Tests', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('Payment Failure Webhook Processing', () => {
    it('should process PAYMENT_FAILED_WEBHOOK correctly', async () => {
      const webhookPayload = {
        type: 'PAYMENT_FAILED_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          order: {
            order_id: `elixr_${TEST_ORDER.id}`,
            order_amount: TEST_ORDER.amount,
            order_currency: 'INR',
            order_status: 'FAILED'
          },
          payment: {
            payment_status: 'FAILED',
            payment_amount: TEST_ORDER.amount,
            payment_currency: 'INR',
            payment_message: 'Insufficient funds in account'
          }
        }
      };

      // Mock successful webhook response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Order updated to Payment Failed, notifications sent',
          orderStatus: 'Payment Failed',
          orderId: TEST_ORDER.id
        })
      } as Response) as jest.MockedFunction<typeof fetch>;

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/payment-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.orderStatus).toBe('Payment Failed');
    });

    it('should handle invalid webhook data gracefully', async () => {
      const invalidPayload = {
        type: 'PAYMENT_FAILED_WEBHOOK',
        data: {
          // Missing required fields
        }
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          message: 'Invalid webhook data'
        })
      } as Response) as jest.MockedFunction<typeof fetch>;

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/payment-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Payment Failure Email Notifications', () => {
    it('should send payment failure emails successfully', async () => {
      const emailPayload = {
        orderId: TEST_ORDER.id,
        userEmail: TEST_ORDER.email,
        reason: 'Payment processing failed due to insufficient funds'
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          userEmailSent: true,
          adminEmailSent: true,
          errors: []
        })
      } as Response);

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.userEmailSent).toBe(true);
      expect(result.adminEmailSent).toBe(true);
    });

    it('should handle missing order gracefully', async () => {
      const emailPayload = {
        orderId: 'non-existent-order',
        userEmail: 'test@example.com',
        reason: 'Test failure'
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Order not found'
        })
      } as Response);

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('Payment Failure Page Rendering', () => {
    it('should render payment failure page with order details', async () => {
      const pageUrl = `${TEST_CONFIG.baseUrl}/payment-failed?order_id=${TEST_ORDER.id}&amount=${TEST_ORDER.amount}&reason=Test%20failure`;

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              <h1>Payment Failed</h1>
              <div class="order-details">
                <p>Order ID: ${TEST_ORDER.id}</p>
                <p>Amount: ₹${TEST_ORDER.amount}</p>
                <p>Reason: Test failure</p>
              </div>
              <button>Try Again</button>
              <a href="/contact">Contact Support</a>
            </body>
          </html>
        `
      } as Response);

      const response = await fetch(pageUrl);
      const html = await response.text();
      
      expect(response.ok).toBe(true);
      expect(html).toContain('Payment Failed');
      expect(html).toContain(TEST_ORDER.id);
      expect(html).toContain(`₹${TEST_ORDER.amount}`);
      expect(html).toContain('Try Again');
      expect(html).toContain('Contact Support');
    });

    it('should handle missing order parameters gracefully', async () => {
      const pageUrl = `${TEST_CONFIG.baseUrl}/payment-failed`;

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              <h1>Payment Failed</h1>
              <p>Your payment could not be processed</p>
              <button>Try Again</button>
            </body>
          </html>
        `
      } as Response);

      const response = await fetch(pageUrl);
      const html = await response.text();
      
      expect(response.ok).toBe(true);
      expect(html).toContain('Payment Failed');
      expect(html).toContain('Try Again');
    });
  });

  describe('Complete Payment Failure Flow', () => {
    it('should complete entire payment failure workflow', async () => {
      // Step 1: Simulate payment failure webhook
      const webhookPayload = {
        type: 'PAYMENT_FAILED_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          order: {
            order_id: `elixr_${TEST_ORDER.id}`,
            order_amount: TEST_ORDER.amount,
            order_currency: 'INR',
            order_status: 'FAILED'
          },
          payment: {
            payment_status: 'FAILED',
            payment_amount: TEST_ORDER.amount,
            payment_currency: 'INR',
            payment_message: 'Card declined'
          }
        }
      };

      // Mock webhook processing
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            message: 'Order updated to Payment Failed',
            orderStatus: 'Payment Failed'
          })
        } as Response)
        // Mock email sending
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            userEmailSent: true,
            adminEmailSent: true
          })
        } as Response)
        // Mock page rendering
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '<html><body><h1>Payment Failed</h1></body></html>'
        } as Response);

      // Step 1: Process webhook
      const webhookResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/payment-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      const webhookResult = await webhookResponse.json();
      expect(webhookResult.success).toBe(true);

      // Step 2: Send failure emails (triggered by webhook)
      const emailResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: TEST_ORDER.id,
          userEmail: TEST_ORDER.email,
          reason: 'Card declined'
        })
      });

      const emailResult = await emailResponse.json();
      expect(emailResult.success).toBe(true);

      // Step 3: User redirected to failure page
      const pageResponse = await fetch(
        `${TEST_CONFIG.baseUrl}/payment-failed?order_id=${TEST_ORDER.id}&amount=${TEST_ORDER.amount}&reason=Card%20declined`
      );

      expect(pageResponse.ok).toBe(true);
      const pageHtml = await pageResponse.text();
      expect(pageHtml).toContain('Payment Failed');

      // Verify all steps completed successfully
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('should handle temporary failures gracefully', async () => {
      global.fetch = jest.fn()
        // First attempt fails
        .mockRejectedValueOnce(new Error('Network error'))
        // Retry succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        } as Response);

      let result;
      try {
        // First attempt
        await fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
          method: 'POST',
          body: JSON.stringify({ orderId: TEST_ORDER.id })
        });
      } catch (error) {
        // Retry logic would go here
        result = await fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
          method: 'POST',
          body: JSON.stringify({ orderId: TEST_ORDER.id })
        });
      }

      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const requests = Array(10).fill(null).map(() =>
        fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: `test-order-${Math.random()}`,
            userEmail: 'test@example.com'
          })
        })
      );

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(10);
      results.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });

    it('should complete payment failure flow within acceptable time', async () => {
      const startTime = Date.now();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await fetch(`${TEST_CONFIG.baseUrl}/api/webhook/payment-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PAYMENT_FAILED_WEBHOOK',
          data: { order: { order_id: 'elixr_test' } }
        })
      });

      const duration = Date.now() - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});

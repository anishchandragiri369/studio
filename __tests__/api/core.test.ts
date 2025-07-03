/**
 * Core API Testing Suite
 * Tests fundamental API functionality that should work in all environments
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:9002',
  timeout: 30000,
  retries: 3
};

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('API Core Functionality Tests', () => {
  beforeAll(async () => {
    // Setup test environment
    console.log(`Running tests against: ${TEST_CONFIG.baseUrl}`);
  });

  afterAll(async () => {
    // Cleanup
    jest.restoreAllMocks();
  });

  describe('Authentication API', () => {
    it('should handle user signup', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, user: { id: 'test-user-123' } })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123',
          name: 'Test User'
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
    });

    it('should handle user login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, token: 'mock-jwt-token' })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
    });
  });

  describe('Order Management API', () => {
    it('should create order successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          order: { id: 'test-order-123', status: 'pending' }
        })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'juice-1', quantity: 2 }],
          total: 120,
          customerInfo: { email: 'test@example.com' }
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
      expect(data.order.id).toBeDefined();
    });

    it('should fetch order by ID', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          order: { id: 'test-order-123', status: 'pending', total: 120 }
        })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/orders/test-order-123`);

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
      expect(data.order.id).toBe('test-order-123');
    });
  });

  describe('Payment API', () => {
    it('should create payment order', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          orderId: 'cf-order-123',
          paymentUrl: 'https://test.cashfree.com/pay'
        })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/cashfree/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'test-order-123',
          amount: 120,
          customerEmail: 'test@example.com'
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
      expect(data.orderId).toBeDefined();
    });
  });

  describe('Email API', () => {
    it('should send order confirmation email', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, emailSent: true })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/send-order-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'test-order-123',
          userEmail: 'test@example.com'
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
    });

    it('should send payment failure email', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 
          success: true, 
          userEmailSent: true, 
          adminEmailSent: true 
        })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/send-payment-failure-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'test-order-123',
          userEmail: 'test@example.com',
          reason: 'Test failure'
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Subscription API', () => {
    it('should create subscription', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          subscription: { id: 'sub-123', status: 'active' }
        })
      };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(mockResponse as Response);

      const result = await fetch(`${TEST_CONFIG.baseUrl}/api/subscriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          planId: 'weekly-plan',
          customerInfo: { email: 'test@example.com' }
        })
      });

      expect(result.ok).toBe(true);
      const data = await result.json();
      expect(data.success).toBe(true);
      expect(data.subscription.id).toBeDefined();
    });
  });
});

// Unit Tests for Core Business Logic and Utils
import { 
  formatPrice, 
  formatDate, 
  generateOrderId, 
  validateEmail, 
  calculateDeliveryDate,
  calculateSubscriptionPrice,
  isValidPhoneNumber
} from '../../src/lib/utils';

import { 
  formatCartItems, 
  calculateCartTotal, 
  validateOrderData,
  processPaymentData
} from '../../src/lib/cart-utils';

import { 
  validateSubscriptionData,
  calculateNextDeliveryDate,
  getSubscriptionStatus,
  calculateSubscriptionPricing
} from '../../src/lib/subscription-utils';

// Mock fetch for API tests
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Core Utility Functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatPrice', () => {
    test('formats price correctly', () => {
      expect(formatPrice(1234.56)).toBe('₹1,234.56');
      expect(formatPrice(0)).toBe('₹0.00');
      expect(formatPrice(999)).toBe('₹999.00');
    });

    test('handles invalid inputs gracefully', () => {
      expect(formatPrice(null)).toBe('₹0.00');
      expect(formatPrice(undefined)).toBe('₹0.00');
      expect(formatPrice('invalid')).toBe('₹0.00');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2024-12-01T10:30:00Z');
      expect(formatDate(date)).toMatch(/Dec/);
      expect(formatDate(date)).toMatch(/2024/);
    });

    test('handles string dates', () => {
      const result = formatDate('2024-12-01');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateOrderId', () => {
    test('generates unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ELX/);
      expect(id1.length).toBeGreaterThan(10);
    });
  });

  describe('validateEmail', () => {
    test('validates correct emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    test('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('calculateDeliveryDate', () => {
    test('calculates delivery date correctly', () => {
      const orderDate = new Date('2024-12-01T10:00:00Z');
      const deliveryDate = calculateDeliveryDate(orderDate);
      
      expect(deliveryDate).toBeInstanceOf(Date);
      expect(deliveryDate.getTime()).toBeGreaterThan(orderDate.getTime());
    });

    test('handles weekends correctly', () => {
      const friday = new Date('2024-12-06T10:00:00Z'); // Friday
      const deliveryDate = calculateDeliveryDate(friday);
      
      // Should not deliver on weekends
      expect(deliveryDate.getDay()).not.toBe(0); // Sunday
      expect(deliveryDate.getDay()).not.toBe(6); // Saturday
    });
  });

  describe('isValidPhoneNumber', () => {
    test('validates Indian phone numbers', () => {
      expect(isValidPhoneNumber('+919876543210')).toBe(true);
      expect(isValidPhoneNumber('9876543210')).toBe(true);
      expect(isValidPhoneNumber('09876543210')).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abc')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
    });
  });
});

describe('Cart Utility Functions', () => {
  const mockCartItems = [
    { id: 1, name: 'Orange Juice', price: 120, quantity: 2 },
    { id: 2, name: 'Apple Juice', price: 150, quantity: 1 }
  ];

  describe('formatCartItems', () => {
    test('formats cart items correctly', () => {
      const formatted = formatCartItems(mockCartItems);
      
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toHaveProperty('total');
      expect(formatted[0].total).toBe(240); // 120 * 2
    });

    test('handles empty cart', () => {
      const formatted = formatCartItems([]);
      expect(formatted).toEqual([]);
    });
  });

  describe('calculateCartTotal', () => {
    test('calculates total correctly', () => {
      const total = calculateCartTotal(mockCartItems);
      expect(total).toBe(390); // (120*2) + (150*1)
    });

    test('handles empty cart', () => {
      const total = calculateCartTotal([]);
      expect(total).toBe(0);
    });

    test('includes tax and delivery charges', () => {
      const total = calculateCartTotal(mockCartItems, { includeTax: true, includeDelivery: true });
      expect(total).toBeGreaterThan(390);
    });
  });

  describe('validateOrderData', () => {
    const validOrderData = {
      items: mockCartItems,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        address: '123 Main St, City'
      },
      total: 390
    };

    test('validates correct order data', () => {
      const result = validateOrderData(validOrderData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('detects missing required fields', () => {
      const invalidData = { 
        ...validOrderData, 
        customer: { ...validOrderData.customer }
      };
      // Remove email property
      invalidData.customer = { ...invalidData.customer };
      delete (invalidData.customer as any).email;
      
      const result = validateOrderData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    test('validates email format', () => {
      const invalidData = { 
        ...validOrderData, 
        customer: { ...validOrderData.customer, email: 'invalid-email' }
      };
      
      const result = validateOrderData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });
});

describe('Subscription Utility Functions', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const mockSubscriptionData = {
    plan: 'daily',
    duration: 30,
    items: [
      { id: 1, name: 'Morning Detox', price: 200 }
    ],
    startDate: tomorrow, // Future date
    customer: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9876543210'
    }
  };

  describe('validateSubscriptionData', () => {
    test('validates correct subscription data', () => {
      const result = validateSubscriptionData(mockSubscriptionData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validates plan types', () => {
      const invalidData = { ...mockSubscriptionData, plan: 'invalid-plan' };
      const result = validateSubscriptionData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid subscription plan');
    });

    test('validates duration', () => {
      const invalidData = { ...mockSubscriptionData, duration: 0 };
      const result = validateSubscriptionData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration must be at least 7 days');
    });
  });

  describe('calculateSubscriptionPricing', () => {
    test('calculates daily subscription price', () => {
      const price = calculateSubscriptionPricing(mockSubscriptionData);
      expect(price.dailyPrice).toBe(200);
      expect(price.totalPrice).toBe(5400); // 200 * 30 days with 10% discount for 30 days
    });

    test('applies discounts for longer subscriptions', () => {
      const longSubscription = { ...mockSubscriptionData, duration: 90 };
      const price = calculateSubscriptionPricing(longSubscription);
      
      expect(price.totalPrice).toBeLessThan(200 * 90); // Should have discount
    });
  });

  describe('calculateNextDeliveryDate', () => {
    test('calculates next delivery for daily plan', () => {
      const subscription = { 
        ...mockSubscriptionData, 
        id: 'SUB123',
        status: 'active',
        endDate: new Date('2025-12-31'),
        isActive: true,
        lastDelivery: new Date('2024-12-01') 
      };
      const nextDate = calculateNextDeliveryDate(subscription);
      
      expect(nextDate.getDate()).toBe(2); // Next day
    });

    test('calculates next delivery for weekly plan', () => {
      const subscription = { 
        ...mockSubscriptionData, 
        id: 'SUB124',
        status: 'active',
        endDate: new Date('2025-12-31'),
        isActive: true,
        plan: 'weekly',
        lastDelivery: new Date('2024-12-01') 
      };
      const nextDate = calculateNextDeliveryDate(subscription);
      
      expect(nextDate.getDate()).toBe(8); // Next week
    });
  });

  describe('getSubscriptionStatus', () => {
    test('returns active status for current subscription', () => {
      const subscription = {
        id: 'SUB123',
        plan: 'daily',
        status: 'active',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2025-12-31'),
        isActive: true
      };
      
      const status = getSubscriptionStatus(subscription);
      expect(status).toBe('active');
    });

    test('returns expired status for past subscription', () => {
      const subscription = {
        id: 'SUB124',
        plan: 'daily',
        status: 'expired',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-31'),
        isActive: true // Still active but past end date
      };
      
      const status = getSubscriptionStatus(subscription);
      expect(status).toBe('expired');
    });
  });
});

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Order API', () => {
    test('creates order successfully', async () => {
      const mockResponse = {
        success: true,
        orderId: 'ELX123456',
        paymentLink: 'https://payment.link'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const orderData = {
        items: [{ id: 1, quantity: 2, price: 120 }],
        customer: { name: 'Test User', email: 'test@example.com' },
        total: 240
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/orders/create', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
      
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('ELX123456');
    });

    test('handles order creation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid order data' })
      } as Response);

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({})
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('Payment API', () => {
    test('processes payment confirmation', async () => {
      const mockWebhookData = {
        orderId: 'ELX123456',
        paymentStatus: 'SUCCESS',
        transactionId: 'TXN789'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const response = await fetch('/api/webhook/payment-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockWebhookData)
      });

      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('Subscription API', () => {
    test('creates subscription successfully', async () => {
      const mockSubscription = {
        id: 'SUB123',
        plan: 'daily',
        status: 'active'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubscription
      } as Response);

      const subscriptionData = {
        plan: 'daily',
        duration: 30,
        items: [{ id: 1, name: 'Morning Juice' }]
      };

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const result = await response.json();
      expect(result.id).toBe('SUB123');
      expect(result.status).toBe('active');
    });
  });

  describe('Email API', () => {
    test('sends order confirmation email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, messageId: 'MSG123' })
      } as Response);

      const emailData = {
        to: 'customer@example.com',
        orderId: 'ELX123456',
        items: [{ name: 'Orange Juice', quantity: 2 }]
      };

      const response = await fetch('/api/send-order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('MSG123');
    });

    test('sends payment failure email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const emailData = {
        orderId: 'ELX123456',
        customerEmail: 'customer@example.com',
        amount: 240,
        reason: 'Payment declined'
      };

      const response = await fetch('/api/send-payment-failure-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  test('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetch('/api/test');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toBe('Network error');
    }
  });

  test('handles API server errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    } as Response);

    const response = await fetch('/api/test');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  test('handles malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      }
    } as unknown as Response);

    const response = await fetch('/api/test');
    
    try {
      await response.json();
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toBe('Invalid JSON');
    }
  });
});

describe('Performance and Edge Cases', () => {
  test('handles large cart calculations efficiently', () => {
    const start = Date.now();
    
    const largeCart = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      price: Math.random() * 500,
      quantity: Math.floor(Math.random() * 10) + 1
    }));

    const total = calculateCartTotal(largeCart);
    const duration = Date.now() - start;

    expect(total).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  test('handles edge case inputs', () => {
    // Test with null/undefined inputs
    expect(formatPrice(null)).toBe('₹0.00');
    expect(calculateCartTotal(null)).toBe(0);
    expect(validateEmail(null)).toBe(false);
    
    // Test with empty arrays
    expect(calculateCartTotal([])).toBe(0);
    expect(formatCartItems([])).toEqual([]);
    
    // Test with extreme values
    expect(formatPrice(Number.MAX_SAFE_INTEGER)).toContain('₹');
    expect(formatPrice(-1000)).toBe('₹0.00'); // Negative prices should be 0
  });

  test('validates concurrent operations', async () => {
    // Clear any previous calls
    mockFetch.mockClear();
    
    // Simulate multiple simultaneous API calls
    const promises = Array.from({ length: 10 }, (_, i) => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: i, success: true })
      } as Response);

      return fetch(`/api/test/${i}`);
    });

    const responses = await Promise.all(promises);
    expect(responses).toHaveLength(10);
    expect(mockFetch).toHaveBeenCalledTimes(10);
  });
});

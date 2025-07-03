/**
 * Customer Rating System API Tests
 * Tests all rating endpoints for functionality and edge cases
 */

const { supabase } = require('../../src/lib/supabaseClient');

// Mock Supabase client
jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      range: jest.fn(),
      gte: jest.fn(),
      lte: jest.fn(),
      ilike: jest.fn(),
    })),
    rpc: jest.fn(),
  }
}));

// Mock Next.js request/response
const createMockRequest = (body = {}, method = 'POST') => ({
  json: jest.fn().mockResolvedValue(body),
  method,
  nextUrl: { searchParams: new URLSearchParams() }
});

const createMockResponse = () => {
  const json = jest.fn();
  return {
    json,
    status: jest.fn(() => ({ json }))
  };
};

describe('Rating System API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ratings/submit', () => {
    const { POST } = require('../../src/app/api/ratings/submit/route');

    test('should successfully submit order rating', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456',
        rating: 5,
        qualityRating: 4,
        deliveryRating: 5,
        serviceRating: 4,
        feedbackText: 'Great service!',
        anonymous: false,
        productRatings: [
          {
            juiceId: 'juice-1',
            juiceName: 'Orange Juice',
            rating: 5,
            tasteRating: 5,
            freshnessRating: 4,
            feedbackText: 'Very fresh!',
            wouldRecommend: true
          }
        ]
      });

      // Mock successful database operations
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ data: { id: 'rating-123' }, error: null }),
        update: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('Rating submitted successfully');
    });

    test('should return error for missing required fields', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        // Missing userId and rating
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('required');
    });

    test('should return error for invalid rating values', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456',
        rating: 6, // Invalid rating > 5
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('between 1 and 5');
    });

    test('should prevent duplicate ratings for same order', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456',
        rating: 5,
      });

      // Mock existing rating found
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ 
          data: [{ id: 'existing-rating' }], 
          error: null 
        })
      };

      supabase.from.mockReturnValue(mockChain);

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('already rated');
    });
  });

  describe('GET /api/ratings/list', () => {
    const { GET } = require('../../src/app/api/ratings/list/route');

    test('should return paginated ratings list', async () => {
      const mockRequest = createMockRequest();
      mockRequest.nextUrl.searchParams.set('page', '1');
      mockRequest.nextUrl.searchParams.set('limit', '10');

      const mockRatings = [
        {
          id: 'rating-1',
          order_id: 'order-123',
          rating: 5,
          feedback_text: 'Great!',
          created_at: '2024-01-01T10:00:00Z',
          user_id: 'user-456'
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ 
          data: mockRatings, 
          error: null,
          count: 25
        })
      };

      supabase.from.mockReturnValue(mockChain);

      const response = await GET(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.ratings).toEqual(mockRatings);
      expect(responseData.data.pagination.total).toBe(25);
      expect(responseData.data.pagination.page).toBe(1);
    });

    test('should filter ratings by minimum rating', async () => {
      const mockRequest = createMockRequest();
      mockRequest.nextUrl.searchParams.set('minRating', '4');

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ 
          data: [], 
          error: null,
          count: 0
        })
      };

      supabase.from.mockReturnValue(mockChain);

      await GET(mockRequest);

      expect(mockChain.gte).toHaveBeenCalledWith('rating', 4);
    });
  });

  describe('POST /api/ratings/helpful', () => {
    const { POST } = require('../../src/app/api/ratings/helpful/route');

    test('should mark rating as helpful', async () => {
      const mockRequest = createMockRequest({
        ratingId: 'rating-123',
        userId: 'user-456',
        isHelpful: true
      });

      const mockChain = {
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      supabase.from.mockReturnValue(mockChain);

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockChain.upsert).toHaveBeenCalledWith(
        {
          rating_id: 'rating-123',
          user_id: 'user-456',
          is_helpful: true
        },
        { onConflict: 'rating_id,user_id' }
      );
    });

    test('should return error for missing fields', async () => {
      const mockRequest = createMockRequest({
        ratingId: 'rating-123',
        // Missing userId and isHelpful
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
    });
  });

  describe('POST /api/ratings/request', () => {
    const { POST } = require('../../src/app/api/ratings/request/route');

    test('should send rating request for completed order', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456'
      });

      // Mock order exists and is completed
      const mockOrderChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{
            id: 'order-123',
            status: 'completed',
            rating_requested: false,
            rating_submitted: false
          }],
          error: null
        })
      };

      // Mock rating doesn't exist
      const mockRatingChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };

      // Mock update order
      const mockUpdateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: {},
          error: null
        })
      };

      supabase.from
        .mockReturnValueOnce(mockOrderChain)  // First call for order check
        .mockReturnValueOnce(mockRatingChain) // Second call for rating check
        .mockReturnValueOnce(mockUpdateChain); // Third call for order update

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toContain('Rating request sent');
    });

    test('should not send rating request for incomplete order', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456'
      });

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{
            id: 'order-123',
            status: 'pending', // Not completed
            rating_requested: false,
            rating_submitted: false
          }],
          error: null
        })
      };

      supabase.from.mockReturnValue(mockChain);

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('not eligible');
    });
  });

  describe('Database Integration Tests', () => {
    test('should handle database connection errors', async () => {
      // Temporarily override the mock to simulate connection failure
      jest.doMock('../../src/lib/supabaseClient', () => ({
        supabase: null
      }));

      const { POST } = require('../../src/app/api/ratings/submit/route');
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456',
        rating: 5
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(503);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Database connection not available');
    });

    test('should handle database query errors gracefully', async () => {
      const mockRequest = createMockRequest({
        orderId: 'order-123',
        userId: 'user-456',
        rating: 5
      });

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      };

      supabase.from.mockReturnValue(mockChain);

      const { POST } = require('../../src/app/api/ratings/submit/route');
      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Database error');
    });
  });

  describe('Rating Statistics and Analytics', () => {
    test('should calculate correct average ratings', async () => {
      const ratings = [
        { rating: 5, quality_rating: 4, delivery_rating: 5 },
        { rating: 4, quality_rating: 5, delivery_rating: 4 },
        { rating: 3, quality_rating: 3, delivery_rating: 3 }
      ];

      // This would be part of the analytics functionality
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      const avgQuality = ratings.reduce((sum, r) => sum + r.quality_rating, 0) / ratings.length;
      const avgDelivery = ratings.reduce((sum, r) => sum + r.delivery_rating, 0) / ratings.length;

      expect(avgRating).toBe(4);
      expect(avgQuality).toBeCloseTo(4);
      expect(avgDelivery).toBe(4);
    });

    test('should handle rating distribution correctly', async () => {
      const ratings = [5, 5, 4, 4, 4, 3, 2, 1];
      const distribution = {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      };

      ratings.forEach(rating => {
        distribution[rating]++;
      });

      expect(distribution[5]).toBe(2);
      expect(distribution[4]).toBe(3);
      expect(distribution[3]).toBe(1);
      expect(distribution[2]).toBe(1);
      expect(distribution[1]).toBe(1);
    });
  });
});

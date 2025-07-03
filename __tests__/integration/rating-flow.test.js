/**
 * Rating System Integration Tests
 * Tests the complete rating flow from order completion to rating display
 */

const { supabase } = require('../../src/lib/supabaseClient');

// Test data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
};

const testOrder = {
  id: 'test-order-123',
  user_id: testUser.id,
  items: [
    {
      juiceId: 'orange-juice',
      juiceName: 'Fresh Orange Juice',
      quantity: 2,
      pricePerItem: 150
    },
    {
      juiceId: 'apple-juice', 
      juiceName: 'Green Apple Juice',
      quantity: 1,
      pricePerItem: 120
    }
  ],
  total_amount: 420,
  status: 'completed',
  created_at: new Date().toISOString(),
  rating_requested: false,
  rating_submitted: false
};

describe('Rating System Integration Tests', () => {
  let orderId, userId, ratingId;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  async function cleanupTestData() {
    if (supabase) {
      try {
        // Delete test ratings
        await supabase.from('order_ratings').delete().eq('user_id', testUser.id);
        await supabase.from('product_ratings').delete().eq('user_id', testUser.id);
        await supabase.from('rating_helpfulness').delete().eq('user_id', testUser.id);
        
        // Delete test orders
        await supabase.from('orders').delete().eq('id', testOrder.id);
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }
  }

  describe('Complete Rating Flow', () => {
    test('1. Order completion triggers rating request', async () => {
      // Skip if no database connection
      if (!supabase) {
        console.log('Skipping integration test - no database connection');
        return;
      }

      // Create test order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      expect(orderError).toBeNull();
      expect(orderData).toBeTruthy();
      orderId = orderData.id;
      userId = orderData.user_id;

      // Simulate order completion webhook
      const webhookResponse = await fetch('http://localhost:9002/api/webhooks/order-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.WEBHOOK_SECRET || 'test-secret'
        },
        body: JSON.stringify({
          type: 'order.completed',
          data: {
            order: {
              id: orderId,
              user_id: userId,
              status: 'completed'
            }
          }
        })
      });

      // Should successfully trigger rating request
      expect(webhookResponse.ok).toBe(true);

      // Verify order is marked as rating requested
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('rating_requested')
        .eq('id', orderId)
        .single();

      expect(updatedOrder.rating_requested).toBe(true);
    });

    test('2. User submits rating through API', async () => {
      if (!supabase) return;

      const ratingData = {
        orderId,
        userId,
        rating: 5,
        qualityRating: 5,
        deliveryRating: 4,
        serviceRating: 5,
        feedbackText: 'Excellent service and very fresh juices! Will order again.',
        anonymous: false,
        productRatings: [
          {
            juiceId: 'orange-juice',
            juiceName: 'Fresh Orange Juice',
            rating: 5,
            tasteRating: 5,
            freshnessRating: 5,
            feedbackText: 'Perfect orange flavor, very fresh!',
            wouldRecommend: true
          },
          {
            juiceId: 'apple-juice',
            juiceName: 'Green Apple Juice', 
            rating: 4,
            tasteRating: 4,
            freshnessRating: 4,
            feedbackText: 'Good taste but could be a bit sweeter.',
            wouldRecommend: true
          }
        ]
      };

      const response = await fetch('http://localhost:9002/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ratingData)
      });

      expect(response.ok).toBe(true);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.pointsEarned).toBe(5);

      ratingId = responseData.data.ratingId;

      // Verify rating was saved to database
      const { data: savedRating } = await supabase
        .from('order_ratings')
        .select('*')
        .eq('order_id', orderId)
        .single();

      expect(savedRating).toBeTruthy();
      expect(savedRating.rating).toBe(5);
      expect(savedRating.feedback_text).toContain('Excellent service');

      // Verify product ratings were saved
      const { data: productRatings } = await supabase
        .from('product_ratings')
        .select('*')
        .eq('order_id', orderId);

      expect(productRatings).toHaveLength(2);
      expect(productRatings.find(r => r.juice_id === 'orange-juice').rating).toBe(5);
      expect(productRatings.find(r => r.juice_id === 'apple-juice').rating).toBe(4);

      // Verify order is marked as rating submitted
      const { data: updatedOrder } = await supabase
        .from('orders')
        .select('rating_submitted')
        .eq('id', orderId)
        .single();

      expect(updatedOrder.rating_submitted).toBe(true);
    });

    test('3. Rating appears in public listing', async () => {
      if (!supabase) return;

      const response = await fetch('http://localhost:9002/api/ratings/list?page=1&limit=10');
      expect(response.ok).toBe(true);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      const ourRating = responseData.data.ratings.find(r => r.id === ratingId);
      expect(ourRating).toBeTruthy();
      expect(ourRating.rating).toBe(5);
      expect(ourRating.feedback_text).toContain('Excellent service');
    });

    test('4. Other user marks rating as helpful', async () => {
      if (!supabase) return;

      const otherUserId = 'other-user-456';
      
      const response = await fetch('http://localhost:9002/api/ratings/helpful', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ratingId,
          userId: otherUserId,
          isHelpful: true
        })
      });

      expect(response.ok).toBe(true);

      // Verify helpful count was updated
      const { data: updatedRating } = await supabase
        .from('order_ratings')
        .select('helpful_count')
        .eq('id', ratingId)
        .single();

      expect(updatedRating.helpful_count).toBe(1);
    });

    test('5. User cannot submit duplicate rating', async () => {
      if (!supabase) return;

      const duplicateRatingData = {
        orderId,
        userId,
        rating: 3,
        feedbackText: 'Changed my mind about the rating.'
      };

      const response = await fetch('http://localhost:9002/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicateRatingData)
      });

      expect(response.status).toBe(409);

      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('already rated');
    });

    test('6. Rating statistics are calculated correctly', async () => {
      if (!supabase) return;

      const response = await fetch('http://localhost:9002/api/ratings/list?includeStats=true');
      expect(response.ok).toBe(true);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.statistics).toBeTruthy();
      expect(responseData.data.statistics.totalRatings).toBeGreaterThan(0);
      expect(responseData.data.statistics.averageRating).toBeGreaterThan(0);
      expect(responseData.data.statistics.ratingDistribution).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Cannot rate non-existent order', async () => {
      if (!supabase) return;

      const response = await fetch('http://localhost:9002/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: 'non-existent-order',
          userId: testUser.id,
          rating: 5
        })
      });

      expect(response.status).toBe(404);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Order not found');
    });

    test('Cannot rate incomplete order', async () => {
      if (!supabase) return;

      // Create incomplete order
      const incompleteOrder = {
        ...testOrder,
        id: 'incomplete-order-123',
        status: 'pending'
      };

      await supabase.from('orders').insert(incompleteOrder);

      const response = await fetch('http://localhost:9002/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: incompleteOrder.id,
          userId: testUser.id,
          rating: 5
        })
      });

      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('not eligible');

      // Clean up
      await supabase.from('orders').delete().eq('id', incompleteOrder.id);
    });

    test('Handles invalid rating values', async () => {
      if (!supabase) return;

      const response = await fetch('http://localhost:9002/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          userId: 'new-user-789',
          rating: 6 // Invalid rating
        })
      });

      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('between 1 and 5');
    });

    test('Handles network errors gracefully', async () => {
      // This would test frontend error handling
      // by mocking failed API responses
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      try {
        await fetch('http://localhost:9002/api/ratings/list');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Restore original fetch
      global.fetch = require('node-fetch');
    });
  });

  describe('Performance and Scalability', () => {
    test('Rating list API handles pagination correctly', async () => {
      if (!supabase) return;

      // Test first page
      const page1Response = await fetch('http://localhost:9002/api/ratings/list?page=1&limit=5');
      expect(page1Response.ok).toBe(true);

      const page1Data = await page1Response.json();
      expect(page1Data.data.pagination.page).toBe(1);
      expect(page1Data.data.pagination.limit).toBe(5);

      // Test second page if there are enough ratings
      if (page1Data.data.pagination.total > 5) {
        const page2Response = await fetch('http://localhost:9002/api/ratings/list?page=2&limit=5');
        expect(page2Response.ok).toBe(true);

        const page2Data = await page2Response.json();
        expect(page2Data.data.pagination.page).toBe(2);
      }
    });

    test('Rating list API filters work correctly', async () => {
      if (!supabase) return;

      // Filter by minimum rating
      const filteredResponse = await fetch('http://localhost:9002/api/ratings/list?minRating=4');
      expect(filteredResponse.ok).toBe(true);

      const filteredData = await filteredResponse.json();
      filteredData.data.ratings.forEach(rating => {
        expect(rating.rating).toBeGreaterThanOrEqual(4);
      });

      // Sort by rating descending
      const sortedResponse = await fetch('http://localhost:9002/api/ratings/list?sortBy=rating&sortOrder=desc');
      expect(sortedResponse.ok).toBe(true);

      const sortedData = await sortedResponse.json();
      const ratings = sortedData.data.ratings;
      for (let i = 1; i < ratings.length; i++) {
        expect(ratings[i-1].rating).toBeGreaterThanOrEqual(ratings[i].rating);
      }
    });

    test('Database triggers work correctly', async () => {
      if (!supabase) return;

      // Create a test rating
      const { data: testRating } = await supabase
        .from('order_ratings')
        .insert({
          order_id: orderId,
          user_id: 'trigger-test-user',
          rating: 4,
          feedback_text: 'Testing triggers'
        })
        .select()
        .single();

      const testRatingId = testRating.id;

      // Add helpful vote
      await supabase
        .from('rating_helpfulness')
        .insert({
          rating_id: testRatingId,
          user_id: 'helpful-user-1',
          is_helpful: true
        });

      // Check that helpful_count was updated by trigger
      const { data: updatedRating } = await supabase
        .from('order_ratings')
        .select('helpful_count')
        .eq('id', testRatingId)
        .single();

      expect(updatedRating.helpful_count).toBe(1);

      // Add another helpful vote
      await supabase
        .from('rating_helpfulness')
        .insert({
          rating_id: testRatingId,
          user_id: 'helpful-user-2',
          is_helpful: true
        });

      // Check count is now 2
      const { data: finalRating } = await supabase
        .from('order_ratings')
        .select('helpful_count')
        .eq('id', testRatingId)
        .single();

      expect(finalRating.helpful_count).toBe(2);

      // Clean up test data
      await supabase.from('rating_helpfulness').delete().eq('rating_id', testRatingId);
      await supabase.from('order_ratings').delete().eq('id', testRatingId);
    });
  });
});

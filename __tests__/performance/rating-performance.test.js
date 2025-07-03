/**
 * Rating System Performance Tests
 * Tests the rating system under load and stress conditions
 */

const { performance } = require('perf_hooks');

// Mock data generators
function generateRandomOrder() {
  return {
    id: `order-${Math.random().toString(36).substring(7)}`,
    user_id: `user-${Math.random().toString(36).substring(7)}`,
    items: [
      {
        juiceId: 'orange-juice',
        juiceName: 'Fresh Orange Juice',
        quantity: Math.floor(Math.random() * 3) + 1,
        pricePerItem: 150
      }
    ],
    total_amount: 150,
    status: 'completed',
    created_at: new Date().toISOString(),
    rating_requested: false,
    rating_submitted: false
  };
}

function generateRandomRating(orderId, userId) {
  return {
    orderId,
    userId,
    rating: Math.floor(Math.random() * 5) + 1,
    qualityRating: Math.floor(Math.random() * 5) + 1,
    deliveryRating: Math.floor(Math.random() * 5) + 1,
    serviceRating: Math.floor(Math.random() * 5) + 1,
    feedbackText: [
      'Excellent service and fresh juices!',
      'Good quality, fast delivery.',
      'Average experience, could be better.',
      'Great taste, will order again!',
      'Fresh and delicious, highly recommended.',
      'Decent juice but delivery was late.',
      'Amazing flavors, perfect packaging.',
      'Not bad, but expected better quality.',
      'Outstanding service and product quality!',
      'Okay juice, nothing special.'
    ][Math.floor(Math.random() * 10)],
    anonymous: Math.random() > 0.7,
    productRatings: [
      {
        juiceId: 'orange-juice',
        juiceName: 'Fresh Orange Juice',
        rating: Math.floor(Math.random() * 5) + 1,
        tasteRating: Math.floor(Math.random() * 5) + 1,
        freshnessRating: Math.floor(Math.random() * 5) + 1,
        feedbackText: 'Great orange flavor!',
        wouldRecommend: Math.random() > 0.3
      }
    ]
  };
}

// Performance test utilities
async function measureApiCall(url, options = {}) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const responseData = await response.json();
    
    return {
      success: response.ok,
      duration: endTime - startTime,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      duration: endTime - startTime,
      error: error.message
    };
  }
}

async function runConcurrentRequests(requestFn, concurrency = 10, iterations = 100) {
  const results = [];
  const batches = Math.ceil(iterations / concurrency);
  
  console.log(`Running ${iterations} requests in ${batches} batches of ${concurrency}`);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, iterations - batch * concurrency);
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      promises.push(requestFn());
    }
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    if (batch < batches - 1) {
      // Brief pause between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

function analyzeResults(results) {
  const durations = results.map(r => r.duration);
  const successCount = results.filter(r => r.success).length;
  
  return {
    total: results.length,
    successful: successCount,
    failed: results.length - successCount,
    successRate: (successCount / results.length) * 100,
    avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    p95Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)],
    p99Duration: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)]
  };
}

describe('Rating System Performance Tests', () => {
  const BASE_URL = 'http://localhost:9002';
  
  test('Rating submission performance under load', async () => {
    const testDuration = 30000; // 30 seconds
    const concurrency = 20;
    const targetRps = 10; // requests per second
    
    console.log(`Testing rating submission for ${testDuration}ms with ${concurrency} concurrent requests`);
    
    const submitRating = async () => {
      const order = generateRandomOrder();
      const rating = generateRandomRating(order.id, order.user_id);
      
      return measureApiCall(`${BASE_URL}/api/ratings/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rating)
      });
    };
    
    const iterations = Math.floor((testDuration / 1000) * targetRps);
    const results = await runConcurrentRequests(submitRating, concurrency, iterations);
    
    const analysis = analyzeResults(results);
    
    console.log('Rating Submission Performance Results:');
    console.log(`  Total requests: ${analysis.total}`);
    console.log(`  Success rate: ${analysis.successRate.toFixed(2)}%`);
    console.log(`  Average duration: ${analysis.avgDuration.toFixed(2)}ms`);
    console.log(`  95th percentile: ${analysis.p95Duration.toFixed(2)}ms`);
    console.log(`  99th percentile: ${analysis.p99Duration.toFixed(2)}ms`);
    
    // Performance assertions
    expect(analysis.successRate).toBeGreaterThan(95); // At least 95% success rate
    expect(analysis.avgDuration).toBeLessThan(2000); // Average response under 2 seconds
    expect(analysis.p95Duration).toBeLessThan(5000); // 95% of requests under 5 seconds
  }, 60000); // 60 second timeout

  test('Rating list API performance with pagination', async () => {
    console.log('Testing rating list API performance');
    
    const fetchRatings = async () => {
      const page = Math.floor(Math.random() * 10) + 1;
      const limit = [5, 10, 20, 50][Math.floor(Math.random() * 4)];
      const minRating = Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 1 : null;
      
      let url = `${BASE_URL}/api/ratings/list?page=${page}&limit=${limit}`;
      if (minRating) {
        url += `&minRating=${minRating}`;
      }
      
      return measureApiCall(url);
    };
    
    const results = await runConcurrentRequests(fetchRatings, 15, 100);
    const analysis = analyzeResults(results);
    
    console.log('Rating List Performance Results:');
    console.log(`  Total requests: ${analysis.total}`);
    console.log(`  Success rate: ${analysis.successRate.toFixed(2)}%`);
    console.log(`  Average duration: ${analysis.avgDuration.toFixed(2)}ms`);
    console.log(`  95th percentile: ${analysis.p95Duration.toFixed(2)}ms`);
    
    expect(analysis.successRate).toBeGreaterThan(98);
    expect(analysis.avgDuration).toBeLessThan(1000); // List should be faster than submission
    expect(analysis.p95Duration).toBeLessThan(2000);
  }, 30000);

  test('Helpful voting performance', async () => {
    console.log('Testing helpful voting performance');
    
    const voteHelpful = async () => {
      const ratingId = `rating-${Math.random().toString(36).substring(7)}`;
      const userId = `user-${Math.random().toString(36).substring(7)}`;
      const isHelpful = Math.random() > 0.5;
      
      return measureApiCall(`${BASE_URL}/api/ratings/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ratingId,
          userId,
          isHelpful
        })
      });
    };
    
    const results = await runConcurrentRequests(voteHelpful, 10, 50);
    const analysis = analyzeResults(results);
    
    console.log('Helpful Voting Performance Results:');
    console.log(`  Total requests: ${analysis.total}`);
    console.log(`  Success rate: ${analysis.successRate.toFixed(2)}%`);
    console.log(`  Average duration: ${analysis.avgDuration.toFixed(2)}ms`);
    
    expect(analysis.avgDuration).toBeLessThan(500); // Voting should be very fast
  }, 15000);

  test('Database query optimization', async () => {
    console.log('Testing database query performance');
    
    // Test various query patterns
    const queries = [
      { url: `${BASE_URL}/api/ratings/list?sortBy=rating&sortOrder=desc`, name: 'Sort by rating' },
      { url: `${BASE_URL}/api/ratings/list?sortBy=created_at&sortOrder=desc`, name: 'Sort by date' },
      { url: `${BASE_URL}/api/ratings/list?sortBy=helpful&sortOrder=desc`, name: 'Sort by helpful' },
      { url: `${BASE_URL}/api/ratings/list?minRating=4`, name: 'Filter by rating' },
      { url: `${BASE_URL}/api/ratings/list?search=excellent`, name: 'Text search' },
      { url: `${BASE_URL}/api/ratings/list?includeStats=true`, name: 'With statistics' }
    ];
    
    const results = {};
    
    for (const query of queries) {
      const queryResults = await runConcurrentRequests(
        () => measureApiCall(query.url),
        5,
        20
      );
      
      results[query.name] = analyzeResults(queryResults);
    }
    
    console.log('Database Query Performance Results:');
    Object.entries(results).forEach(([name, analysis]) => {
      console.log(`  ${name}:`);
      console.log(`    Average: ${analysis.avgDuration.toFixed(2)}ms`);
      console.log(`    95th percentile: ${analysis.p95Duration.toFixed(2)}ms`);
      
      // All queries should complete within reasonable time
      expect(analysis.avgDuration).toBeLessThan(1500);
      expect(analysis.p95Duration).toBeLessThan(3000);
    });
  }, 45000);

  test('Memory usage during high load', async () => {
    console.log('Testing memory usage during high load');
    
    const initialMemory = process.memoryUsage();
    
    // Generate a lot of rating submissions
    const heavyLoad = async () => {
      const rating = generateRandomRating(
        `order-${Math.random().toString(36).substring(7)}`,
        `user-${Math.random().toString(36).substring(7)}`
      );
      
      // Add large feedback text to test memory handling
      rating.feedbackText = 'A'.repeat(1000); // 1KB of text
      
      return measureApiCall(`${BASE_URL}/api/ratings/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rating)
      });
    };
    
    await runConcurrentRequests(heavyLoad, 25, 100);
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    console.log('Memory Usage Results:');
    console.log(`  Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    
    // Memory increase should be reasonable (less than 100MB for this test)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  }, 60000);

  test('Error rate under stress', async () => {
    console.log('Testing error handling under stress conditions');
    
    // Mix of valid and invalid requests
    const stressTest = async () => {
      const shouldFail = Math.random() < 0.2; // 20% failure rate
      
      if (shouldFail) {
        // Submit invalid rating
        return measureApiCall(`${BASE_URL}/api/ratings/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderId: 'invalid-order',
            userId: 'invalid-user',
            rating: 10 // Invalid rating
          })
        });
      } else {
        // Submit valid rating
        const order = generateRandomOrder();
        const rating = generateRandomRating(order.id, order.user_id);
        
        return measureApiCall(`${BASE_URL}/api/ratings/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rating)
        });
      }
    };
    
    const results = await runConcurrentRequests(stressTest, 30, 200);
    const analysis = analyzeResults(results);
    
    const errorResults = results.filter(r => !r.success);
    const validErrors = errorResults.filter(r => r.status === 400 || r.status === 404);
    const serverErrors = errorResults.filter(r => r.status >= 500);
    
    console.log('Stress Test Results:');
    console.log(`  Total requests: ${analysis.total}`);
    console.log(`  Successful: ${analysis.successful}`);
    console.log(`  Client errors (expected): ${validErrors.length}`);
    console.log(`  Server errors: ${serverErrors.length}`);
    console.log(`  Network errors: ${errorResults.length - validErrors.length - serverErrors.length}`);
    
    // Server errors should be minimal even under stress
    expect(serverErrors.length).toBeLessThan(analysis.total * 0.05); // Less than 5% server errors
    expect(analysis.avgDuration).toBeLessThan(3000); // Should still respond reasonably fast
  }, 90000);
});

// Utility function for manual performance testing
async function runPerformanceTest(options = {}) {
  const {
    endpoint = '/api/ratings/list',
    method = 'GET',
    body = null,
    concurrency = 10,
    iterations = 100,
    duration = null
  } = options;

  console.log(`Running performance test for ${endpoint}`);
  console.log(`Concurrency: ${concurrency}, Iterations: ${iterations}`);

  const testFn = async () => {
    const url = `http://localhost:9002${endpoint}`;
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    return measureApiCall(url, requestOptions);
  };

  let results;
  if (duration) {
    // Run for specified duration
    results = [];
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      const batchResults = await runConcurrentRequests(testFn, concurrency, concurrency);
      results.push(...batchResults);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } else {
    // Run for specified iterations
    results = await runConcurrentRequests(testFn, concurrency, iterations);
  }

  const analysis = analyzeResults(results);
  
  console.log('\nPerformance Test Results:');
  console.log('========================');
  console.log(`Total requests: ${analysis.total}`);
  console.log(`Successful: ${analysis.successful} (${analysis.successRate.toFixed(2)}%)`);
  console.log(`Failed: ${analysis.failed}`);
  console.log(`Average duration: ${analysis.avgDuration.toFixed(2)}ms`);
  console.log(`Min duration: ${analysis.minDuration.toFixed(2)}ms`);
  console.log(`Max duration: ${analysis.maxDuration.toFixed(2)}ms`);
  console.log(`95th percentile: ${analysis.p95Duration.toFixed(2)}ms`);
  console.log(`99th percentile: ${analysis.p99Duration.toFixed(2)}ms`);

  return analysis;
}

module.exports = {
  runPerformanceTest,
  generateRandomOrder,
  generateRandomRating,
  measureApiCall,
  runConcurrentRequests,
  analyzeResults
};

/**
 * Debug script to check reward points system
 * This can be run from the browser console or as a simple API test
 */

// Test function to check if rewards are working
async function debugRewards(userId) {
  console.log('Debugging rewards for user:', userId);
  
  try {
    // Test the rewards API
    const rewardsResponse = await fetch(`/api/rewards/user/${userId}`);
    const rewardsResult = await rewardsResponse.json();
    
    console.log('Rewards API response:', rewardsResult);
    
    // Test the transactions API
    const transactionsResponse = await fetch(`/api/rewards/transactions/${userId}`);
    const transactionsResult = await transactionsResponse.json();
    
    console.log('Transactions API response:', transactionsResult);
    
    return {
      rewards: rewardsResult,
      transactions: transactionsResult
    };
  } catch (error) {
    console.error('Error debugging rewards:', error);
    return { error: error.message };
  }
}

// Test function to simulate rating submission
async function testRatingSubmission(orderId, userId) {
  console.log('Testing rating submission for order:', orderId, 'user:', userId);
  
  try {
    const response = await fetch('/api/ratings/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        userId,
        rating: 5,
        feedbackText: 'Test rating for reward points debugging'
      }),
    });
    
    const result = await response.json();
    console.log('Rating submission response:', result);
    
    return result;
  } catch (error) {
    console.error('Error testing rating submission:', error);
    return { error: error.message };
  }
}

// Make functions available globally for browser console testing
if (typeof window !== 'undefined') {
  window.debugRewards = debugRewards;
  window.testRatingSubmission = testRatingSubmission;
  
  console.log('Reward debugging functions available:');
  console.log('- debugRewards(userId)');
  console.log('- testRatingSubmission(orderId, userId)');
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugRewards, testRatingSubmission };
}

/**
 * Browser-compatible debug script for rewards
 * Load this in your browser console on the account page
 */

// Function to test rewards API from browser
async function debugRewardsInBrowser() {
  console.log('🔍 Testing rewards API from browser...');
  
  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b'; // Your user ID
  
  try {
    // Test user rewards API
    console.log('📋 Testing /api/rewards/user/' + userId);
    const userResponse = await fetch('/api/rewards/user/' + userId);
    console.log('User API Status:', userResponse.status);
    
    if (userResponse.ok) {
      const userResult = await userResponse.json();
      console.log('User API Response:', userResult);
    } else {
      const errorText = await userResponse.text();
      console.error('User API Error:', errorText);
    }
    
    // Test transactions API
    console.log('\n📋 Testing /api/rewards/transactions/' + userId);
    const transResponse = await fetch('/api/rewards/transactions/' + userId);
    console.log('Transactions API Status:', transResponse.status);
    
    if (transResponse.ok) {
      const transResult = await transResponse.json();
      console.log('Transactions API Response:', transResult);
    } else {
      const errorText = await transResponse.text();
      console.error('Transactions API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Function to force refresh rewards display
function forceRefreshRewards() {
  console.log('🔄 Forcing rewards refresh...');
  window.dispatchEvent(new CustomEvent('ratingSubmitted', {
    detail: { orderId: 'test', pointsEarned: 0 }
  }));
}

// Make functions available
window.debugRewardsInBrowser = debugRewardsInBrowser;
window.forceRefreshRewards = forceRefreshRewards;

console.log('🎯 Rewards debug functions loaded:');
console.log('- debugRewardsInBrowser() - Test API endpoints');
console.log('- forceRefreshRewards() - Force refresh rewards display');

// Browser debug script for rewards display
// Open browser console and paste this script to test rewards display

console.log('🔍 Testing Rewards Display in Browser...');

// Test the API endpoints from the browser
async function testRewardsInBrowser() {
  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  const baseUrl = window.location.origin;
  
  try {
    console.log('1. Testing rewards API from browser...');
    const rewardsResponse = await fetch(`${baseUrl}/api/rewards/user/${userId}`);
    const rewardsData = await rewardsResponse.json();
    console.log('Rewards API:', rewardsData);
    
    console.log('2. Testing transactions API from browser...');
    const transactionsResponse = await fetch(`${baseUrl}/api/rewards/transactions/${userId}`);
    const transactionsData = await transactionsResponse.json();
    console.log('Transactions API:', transactionsData);
    
    // Force refresh the rewards component if it exists
    console.log('3. Attempting to refresh rewards display...');
    const event = new CustomEvent('forceRewardsRefresh', { detail: { userId } });
    window.dispatchEvent(event);
    
    // Try to trigger a rating submitted event to refresh rewards
    const ratingEvent = new CustomEvent('ratingSubmitted');
    window.dispatchEvent(ratingEvent);
    
    console.log('✅ Test completed! Check the rewards section in your account.');
    console.log('If rewards still don\'t show, try refreshing the page.');
    
  } catch (error) {
    console.error('❌ Error testing rewards:', error);
  }
}

// Run the test
testRewardsInBrowser();

// Also expose the function for manual testing
window.testRewardsInBrowser = testRewardsInBrowser;

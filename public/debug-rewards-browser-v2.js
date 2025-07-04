// Browser debug script to test API endpoints from the frontend
// Open browser console and paste this script

async function testRewardsAPIs() {
  console.log('🔍 Testing Rewards APIs from Browser...\n');
  
  // Get the current user ID from auth context if available
  let userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b'; // Known user ID
  
  console.log('Testing with user ID:', userId);
  
  try {
    // Test rewards API
    console.log('\n1. Testing Rewards API...');
    const rewardsUrl = `/api/rewards/user/${userId}`;
    console.log('Fetching:', rewardsUrl);
    
    const rewardsResponse = await fetch(rewardsUrl);
    console.log('Rewards Response Status:', rewardsResponse.status);
    
    const rewardsData = await rewardsResponse.json();
    console.log('Rewards Response Data:', rewardsData);
    
    // Test transactions API
    console.log('\n2. Testing Transactions API...');
    const transUrl = `/api/rewards/transactions/${userId}`;
    console.log('Fetching:', transUrl);
    
    const transResponse = await fetch(transUrl);
    console.log('Transactions Response Status:', transResponse.status);
    
    const transData = await transResponse.json();
    console.log('Transactions Response Data:', transData);
    
    // Check if RewardsDisplay component is mounted
    console.log('\n3. Checking RewardsDisplay component...');
    const rewardsComponent = document.querySelector('[data-testid="rewards-display"]') || 
                           document.querySelector('.rewards-display') ||
                           document.querySelector('div').textContent?.includes('reward');
    
    console.log('Rewards component found:', !!rewardsComponent);
    
    // Try to trigger a refresh of the rewards component
    console.log('\n4. Triggering rewards refresh...');
    window.dispatchEvent(new CustomEvent('ratingSubmitted'));
    
    // Check localStorage for any cached data
    console.log('\n5. Checking localStorage...');
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('reward') || key.includes('point') || key.includes('user')
    );
    console.log('Relevant localStorage keys:', keys);
    keys.forEach(key => {
      console.log(`${key}:`, localStorage.getItem(key));
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Also create a function to force refresh the rewards
window.refreshRewards = function() {
  console.log('Force refreshing rewards...');
  window.dispatchEvent(new CustomEvent('ratingSubmitted'));
};

console.log('Browser debug script loaded. Run testRewardsAPIs() to test APIs.');
console.log('Run refreshRewards() to force refresh the rewards component.');

testRewardsAPIs();

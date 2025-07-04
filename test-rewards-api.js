/**
 * Test the rewards API endpoint directly
 */

require('dotenv').config();

async function testRewardsAPI() {
  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  
  console.log('🧪 Testing Rewards API endpoints...\n');
  
  try {
    // Test the user rewards API
    console.log('📋 Testing /api/rewards/user/${userId}...');
    const userResponse = await fetch(`http://localhost:3000/api/rewards/user/${userId}`);
    const userResult = await userResponse.json();
    
    console.log('Status:', userResponse.status);
    console.log('Response:', JSON.stringify(userResult, null, 2));
    
    // Test the transactions API
    console.log('\n📋 Testing /api/rewards/transactions/${userId}...');
    const transactionsResponse = await fetch(`http://localhost:3000/api/rewards/transactions/${userId}`);
    const transactionsResult = await transactionsResponse.json();
    
    console.log('Status:', transactionsResponse.status);
    console.log('Response:', JSON.stringify(transactionsResult, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure your Next.js development server is running:');
    console.log('   npm run dev');
  }
}

testRewardsAPI();

const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
const baseUrl = 'http://localhost:9002';

async function testAPIs() {
  try {
    console.log('Testing rewards API...');
    const rewardsResponse = await fetch(`${baseUrl}/api/rewards/user/${userId}`);
    const rewardsData = await rewardsResponse.json();
    console.log('=== REWARDS API RESPONSE ===');
    console.log(JSON.stringify(rewardsData, null, 2));

    console.log('\nTesting transactions API...');
    const transactionsResponse = await fetch(`${baseUrl}/api/rewards/transactions/${userId}`);
    const transactionsData = await transactionsResponse.json();
    console.log('\n=== TRANSACTIONS API RESPONSE ===');
    console.log(JSON.stringify(transactionsData, null, 2));

  } catch (error) {
    console.error('Error testing APIs:', error);
  }
}

testAPIs();

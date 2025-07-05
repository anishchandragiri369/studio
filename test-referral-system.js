// Test referral code functionality
// Run this to test the referral system end-to-end

const testReferralCode = 'ELIXR8967ff'; // Your existing referral code (exact case)
const baseUrl = 'http://localhost:9002'; // Dev server URL

async function testReferralSystem() {
  console.log('🔍 Testing Referral System...\n');

  try {
    // Test 1: Validate existing referral code
    console.log('1. Testing referral code validation...');
    const validateResponse = await fetch(`${baseUrl}/api/referrals/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode: testReferralCode })
    });
    
    const validateResult = await validateResponse.json();
    console.log('Validation result:', validateResult);

    // Test 2: Test invalid referral code
    console.log('\n2. Testing invalid referral code...');
    const invalidResponse = await fetch(`${baseUrl}/api/referrals/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode: 'INVALID123' })
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('Invalid code result:', invalidResult);

    // Test 3: Check current rewards
    console.log('\n3. Checking current rewards...');
    const rewardsResponse = await fetch(`${baseUrl}/api/rewards/user/8967ff0e-2f67-47fa-8b2f-4fa7e945c14b`);
    const rewardsData = await rewardsResponse.json();
    console.log('Current rewards:', rewardsData);

    console.log('\n✅ Referral system testing complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Sign up with a new account using the referral code');
    console.log('2. Complete the first order');
    console.log('3. Check if referral rewards are awarded');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testReferralSystem();

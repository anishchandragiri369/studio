require('dotenv').config({ path: '.env.local' });

async function testReferralCodeValidation() {
  console.log('🧪 Testing Referral Code Validation');
  console.log('==================================');
  
  const testCodes = [
    'ELIXRF482A2',  // All uppercase (what's now in DB)
    'elixrf482a2',  // All lowercase (user might type)
    'ElixrF482a2',  // Mixed case (user might type)
    'ELIXR8967FF',  // Another uppercase code
    'elixr8967ff',  // Same but lowercase
    'INVALIDCODE'   // Invalid code
  ];
  
  for (const testCode of testCodes) {
    console.log(`\n🔍 Testing code: "${testCode}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: testCode })
      });
      
      const result = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Result: ${result.success ? '✅ VALID' : '❌ INVALID'}`);
      if (result.message) {
        console.log(`   Message: ${result.message}`);
      }
      if (result.referrerId) {
        console.log(`   Referrer ID: ${result.referrerId}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error testing "${testCode}":`, error.message);
    }
  }
}

testReferralCodeValidation();

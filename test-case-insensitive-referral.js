require('dotenv').config({ path: '.env.local' });

async function testCaseInsensitiveReferralCodes() {
  console.log('🧪 Testing Case-Insensitive Referral Code Validation');
  console.log('=====================================================\n');

  // Test with the actual referral code from the database
  const testCodes = [
    'ELIXR8967ff',    // Original case
    'ELIXR8967FF',    // All uppercase
    'elixr8967ff',    // All lowercase
    'ElIxR8967Ff',    // Mixed case
  ];

  for (const testCode of testCodes) {
    console.log(`Testing referral code: "${testCode}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: testCode })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`   ✅ VALID - Code accepted`);
      } else {
        console.log(`   ❌ INVALID - ${result.message}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
    }
  }

  console.log('\n🎯 Expected Results:');
  console.log('   All test cases should return VALID');
  console.log('   This confirms case-insensitive matching is working');
}

testCaseInsensitiveReferralCodes();

require('dotenv').config({ path: '.env.local' });

async function testReferralCodeCases() {
  console.log('🧪 Testing Referral Code Case Sensitivity');
  console.log('=========================================\n');
  
  try {
    // Test different case variations of the same referral code
    const testCodes = [
      'ELIXR8967FF',  // All uppercase (what user entered)
      'elixr8967ff',  // All lowercase (what's in DB)
      'Elixr8967ff',  // Mixed case
      'ELIXR8967ff'   // Partially different case
    ];
    
    for (const code of testCodes) {
      console.log(`Testing code: "${code}"`);
      
      // Test validation endpoint
      const validateResponse = await fetch('http://localhost:3000/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referralCode: code,
          userId: '00000000-0000-0000-0000-000000000000' // fake user ID to avoid self-referral check
        })
      });
      
      const validateResult = await validateResponse.json();
      console.log(`  Validation result: ${validateResult.success ? '✅ VALID' : '❌ INVALID'}`);
      if (!validateResult.success) {
        console.log(`  Error: ${validateResult.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testReferralCodeCases();

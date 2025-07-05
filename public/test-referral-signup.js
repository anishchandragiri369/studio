// Browser test for referral code signup
// Open browser console and run this to test the signup form with referral code

console.log('🔍 Testing Referral Code Signup...');

// Test the referral code validation in the browser
async function testSignupWithReferral() {
  const testReferralCode = 'ELIXR8967ff';
  
  console.log('1. Testing referral code validation from browser...');
  
  try {
    const response = await fetch('/api/referrals/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode: testReferralCode })
    });
    
    const result = await response.json();
    console.log('✅ Referral validation result:', result);
    
    if (result.success) {
      console.log('✅ Referral code is valid! You can use it during signup.');
      console.log(`🔗 Signup with referral link: ${window.location.origin}/signup?ref=${testReferralCode}`);
    } else {
      console.log('❌ Referral code validation failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing referral code:', error);
  }
}

// Function to simulate URL with referral parameter
function testReferralURL() {
  const referralCode = 'ELIXR8967ff';
  const signupURL = `${window.location.origin}/signup?ref=${referralCode}`;
  console.log(`🔗 Test signup with referral URL: ${signupURL}`);
  console.log('Click the link above to test the signup form with pre-filled referral code');
}

// Run tests
testSignupWithReferral();
testReferralURL();

// Expose functions for manual testing
window.testSignupWithReferral = testSignupWithReferral;
window.testReferralURL = testReferralURL;

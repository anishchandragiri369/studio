// Simple test to replicate the frontend fetch call
async function testFrontendFetch() {
  console.log('🧪 Testing frontend fetch call');
  
  try {
    const response = await fetch('http://localhost:9002/api/referrals/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode: 'ELIXR8967FF'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      console.error('Response not ok:', response.statusText);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response:', result);

    if (result.success) {
      console.log('✅ Referral code is valid!');
      console.log('Referrer ID:', result.referrerId);
    } else {
      console.log('❌ Referral code validation failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
    console.error('Error type:', error.constructor.name);
  }
}

testFrontendFetch();

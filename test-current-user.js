// Test with the exact same user ID that might be causing the issue
async function testWithCurrentUser() {
  console.log('🧪 Testing with current user scenario');
  
  // First, let's see who owns this referral code
  const ownerResponse = await fetch('http://localhost:9002/api/referrals/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referralCode: 'ELIXR8967FF'
    })
  });

  const ownerResult = await ownerResponse.json();
  console.log('Owner check:', ownerResult);

  if (ownerResult.referrerId) {
    // Now test with the same user trying to use their own code
    console.log('Testing with owner using their own code...');
    
    const selfResponse = await fetch('http://localhost:9002/api/referrals/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode: 'ELIXR8967FF',
        userId: ownerResult.referrerId  // Same user as owner
      })
    });

    console.log('Self-referral response status:', selfResponse.status);
    const selfResult = await selfResponse.json();
    console.log('Self-referral response:', selfResult);
  }

  // Test with a different user
  console.log('Testing with different user...');
  
  const differentResponse = await fetch('http://localhost:9002/api/referrals/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referralCode: 'ELIXR8967FF',
      userId: '00000000-1111-2222-3333-444444444444'  // Different user
    })
  });

  console.log('Different user response status:', differentResponse.status);
  const differentResult = await differentResponse.json();
  console.log('Different user response:', differentResult);
}

testWithCurrentUser();

// Test with userId parameter
async function testWithUserId() {
  console.log('🧪 Testing with userId parameter');
  
  try {
    const response = await fetch('http://localhost:9002/api/referrals/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode: 'ELIXR8967FF',
        userId: 'some-user-id'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const result = await response.json();
    console.log('API Response:', result);

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
}

// Test with undefined userId
async function testWithUndefinedUserId() {
  console.log('🧪 Testing with undefined userId');
  
  try {
    const response = await fetch('http://localhost:9002/api/referrals/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode: 'ELIXR8967FF',
        userId: undefined
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const result = await response.json();
    console.log('API Response:', result);

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
}

testWithUserId().then(() => testWithUndefinedUserId());

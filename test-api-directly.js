async function testAPIDirectly() {
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

    const result = await response.json();
    console.log('API Response:', result);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('API Error:', error);
  }
}

testAPIDirectly();

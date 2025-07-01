const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testPaymentFailureAPI() {
  console.log('Testing payment failure email API...');
  
  try {
    const response = await fetch('http://localhost:9002/api/send-payment-failure-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: '1cb8faa3-be4b-4b55-ada3-93736b830141', // Use a real order ID
        userEmail: 'bobby.ani209@gmail.com',
        reason: 'Test payment failure - insufficient funds'
      }),
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Response data:', data);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPaymentFailureAPI();

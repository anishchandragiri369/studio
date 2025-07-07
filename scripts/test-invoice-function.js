const fetch = require('node-fetch');

async function testInvoiceFunction() {
  console.log('Testing Netlify invoice function...');
  
  const testOrder = {
    id: 'test-order-123',
    total_amount: 2599,
    items: [
      {
        name: 'Test Juice',
        quantity: 1,
        pricePerItem: 2599
      }
    ],
    shipping_address: {
      name: 'Test Customer',
      email: 'test@example.com',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345'
    }
  };
  
  const testCustomer = {
    name: 'Test Customer',
    email: 'test@example.com'
  };
  
  const functionUrl = 'https://develixr.netlify.app/.netlify/functions/generate-invoice';
  
  try {
    console.log('Calling function at:', functionUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order: testOrder, customer: testCustomer }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (contentType?.includes('text/html')) {
        const html = await response.text();
        console.log('✅ Function returned HTML successfully');
        console.log('HTML length:', html.length);
        console.log('HTML preview:', html.substring(0, 200) + '...');
      } else {
        console.log('⚠️ Unexpected content type:', contentType);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Function failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error calling function:', error.message);
  }
}

testInvoiceFunction(); 
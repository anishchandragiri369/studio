const fetch = require('node-fetch');

async function testInvoiceGeneration() {
  console.log('🧪 Testing Invoice Generation');
  console.log('=============================\n');

  try {
    // Test data
    const testOrder = {
      id: '7a9285e7-a1ac-412f-ad8f-a837e9c6955a',
      user_id: '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
      total_amount: 2599,
      subtotal: 2599,
      items: [
        {
          name: 'Monthly Juice Plan',
          quantity: 1,
          price: 2599,
          pricePerItem: 2599
        }
      ],
      shipping_address: {
        firstName: 'Test',
        lastName: 'User',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '500001',
        country: 'India',
        mobileNumber: '1234567890'
      },
      status: 'Payment Success',
      created_at: new Date().toISOString()
    };

    const testCustomer = {
      name: 'Test User',
      email: 'test@example.com'
    };

    console.log('1️⃣ Testing Netlify function directly...');
    
    // Test the Netlify function directly
    const netlifyFunctionUrl = 'https://develixr.netlify.app/.netlify/functions/generate-invoice';
    
    console.log('Calling Netlify function:', netlifyFunctionUrl);
    console.log('Test order ID:', testOrder.id);
    
    const response = await fetch(netlifyFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        order: testOrder, 
        customer: testCustomer 
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const pdfBuffer = await response.arrayBuffer();
      console.log('✅ PDF generated successfully!');
      console.log('PDF size:', pdfBuffer.byteLength, 'bytes');
      
      if (pdfBuffer.byteLength > 0) {
        console.log('✅ PDF has content');
      } else {
        console.log('❌ PDF is empty');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Netlify function failed');
      console.log('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error details:', errorJson);
      } catch (e) {
        console.log('Raw error response:', errorText);
      }
    }

    // Test the invoice API endpoint
    console.log('\n2️⃣ Testing invoice API endpoint...');
    
    const invoiceApiUrl = `https://develixr.netlify.app/api/orders/invoice?orderId=${testOrder.id}&userId=${testOrder.user_id}`;
    
    console.log('Calling invoice API:', invoiceApiUrl);
    
    const apiResponse = await fetch(invoiceApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Response status:', apiResponse.status);
    console.log('API Response headers:', Object.fromEntries(apiResponse.headers.entries()));

    if (apiResponse.ok) {
      const pdfBuffer = await apiResponse.arrayBuffer();
      console.log('✅ Invoice API worked!');
      console.log('PDF size:', pdfBuffer.byteLength, 'bytes');
    } else {
      const errorText = await apiResponse.text();
      console.log('❌ Invoice API failed');
      console.log('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error details:', errorJson);
      } catch (e) {
        console.log('Raw error response:', errorText);
      }
    }

    // Test signature image URL
    console.log('\n3️⃣ Testing signature image URL...');
    
    const signatureUrl = 'https://develixr.netlify.app/images/signature.png';
    
    try {
      const signatureResponse = await fetch(signatureUrl);
      console.log('Signature image status:', signatureResponse.status);
      
      if (signatureResponse.ok) {
        console.log('✅ Signature image is accessible');
      } else {
        console.log('❌ Signature image not found');
        console.log('This might be causing the PDF generation to fail');
      }
    } catch (error) {
      console.log('❌ Error accessing signature image:', error.message);
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testInvoiceGeneration().then(() => {
  console.log('\n🔍 Invoice generation test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Invoice generation test failed:', error);
  process.exit(1);
}); 
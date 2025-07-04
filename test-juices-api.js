// Quick test of the juices API endpoint
const fetch = require('node-fetch');

async function testJuicesAPI() {
  console.log('🧪 Testing Juices API Endpoint');
  console.log('===============================');

  try {
    // Test the juices API endpoint
    const response = await fetch('http://localhost:9002/api/juices');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Juices API response successful');
      console.log(`📊 Response status: ${response.status}`);
      
      if (data.juices && Array.isArray(data.juices)) {
        console.log(`✅ Juices array found with ${data.juices.length} items`);
        
        // Show first juice as example
        if (data.juices.length > 0) {
          const firstJuice = data.juices[0];
          console.log('📝 First juice example:');
          console.log(`   - ID: ${firstJuice.id}`);
          console.log(`   - Name: ${firstJuice.name}`);
          console.log(`   - Price: Rs.${firstJuice.price}`);
          console.log(`   - Available: ${firstJuice.available}`);
        }
        
        console.log('✅ API endpoint is working correctly!');
      } else {
        console.log('⚠️  API response format might be incorrect');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log(`❌ API request failed with status: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error testing API:', error.message);
    console.log('💡 Make sure the development server is running on port 9002');
  }

  console.log('\n🎯 API Test Complete');
}

testJuicesAPI();

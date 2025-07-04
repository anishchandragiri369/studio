// Remove the old fetch import line

async function testFruitBowlsAPI() {
  try {
    console.log('🧪 Testing fruit-bowls API endpoint...');
    
    // Use dynamic import for fetch in Node.js
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:9002/api/fruit-bowls');
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response received');
    
    if (data.fruitBowls && Array.isArray(data.fruitBowls)) {
      console.log(`📊 Found ${data.fruitBowls.length} fruit bowls`);
      
      // Check image fields
      data.fruitBowls.forEach((fruitBowl, index) => {
        const imageSource = fruitBowl.image || fruitBowl.image_url || '/images/fruit-bowl-custom.jpg';
        console.log(`   ${index + 1}. ${fruitBowl.name}`);
        console.log(`      - image: ${fruitBowl.image || 'null'}`);
        console.log(`      - image_url: ${fruitBowl.image_url || 'null'}`);
        console.log(`      - final image: ${imageSource}`);
      });
      
      // Check if all have image field
      const withImage = data.fruitBowls.filter(fb => fb.image && fb.image.trim()).length;
      console.log(`\n🖼️  Fruit bowls with image field: ${withImage}/${data.fruitBowls.length}`);
      
      if (withImage === data.fruitBowls.length) {
        console.log('✅ All fruit bowls have image field populated!');
      } else {
        console.log('⚠️  Some fruit bowls missing image field');
      }
      
    } else {
      console.error('❌ Invalid response format:', data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFruitBowlsAPI();

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateJuicesTable() {
  console.log('🔄 Updating juices table with proper juice data...\n');

  try {
    // First, add the missing columns
    console.log('1️⃣ Adding missing columns...');
    
    // Add is_active column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE juices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;'
    });
    
    if (alterError) {
      console.log('Note: Column might already exist or need admin access for ALTER:', alterError.message);
    }

    // Clear existing data
    console.log('2️⃣ Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('juices')
      .delete()
      .gt('id', 0); // This will delete all rows
    
    if (deleteError) {
      console.error('❌ Error clearing data:', deleteError.message);
      return;
    }

    // Insert new juice data
    console.log('3️⃣ Inserting proper juice data...');
    
    const juices = [
      {
        name: 'Rejoice',
        flavor: 'pomogranate, grape, strawberry, dragon',
        price: 120.00,
        description: 'A vibrant blend of sweet pomogranate, grapes, and a spicy kick of ginger. Perfect to start your day.',
        category: 'Fruit Blast',
        tags: ['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'],
        image: '/images/juice-1.jpeg',
        data_ai_hint: 'pomogranate grape juice',
        stock_quantity: 50
      },
      {
        name: 'Green Vitality',
        flavor: 'Kale, Spinach, Apple, Lemon',
        price: 120.00,
        description: 'Packed with leafy greens, crisp apple, and zesty lemon for a refreshing and nutritious boost.',
        category: 'Green Power',
        tags: ['detox', 'healthy', 'greens', 'Immunity Booster', 'Radiant Health', 'Detoxify', 'Daily Wellness'],
        image: '/images/juice-2.jpeg',
        data_ai_hint: 'green smoothie',
        stock_quantity: 75
      },
      {
        name: 'Berry Bliss',
        flavor: 'Strawberry, Blueberry, Raspberry, Banana',
        price: 120.00,
        description: 'A delightful mix of sweet berries and creamy banana, rich in antioxidants.',
        category: 'Fruit Blast',
        tags: ['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'],
        image: '/images/juice-3.jpeg',
        data_ai_hint: 'berry smoothie',
        stock_quantity: 5
      },
      {
        name: 'Tropical Escape',
        flavor: 'Pineapple, Mango, Coconut Water',
        price: 120.00,
        description: 'Experience a taste of the tropics with this exotic blend of pineapple, mango, and hydrating coconut water.',
        category: 'Exotic Flavors',
        tags: ['tropical', 'hydrating', 'exotic', 'Vacation Vibes'],
        image: '/images/juice-4.jpeg',
        data_ai_hint: 'tropical drink',
        stock_quantity: 30
      },
      {
        name: 'Beet Boost',
        flavor: 'Beetroot, Carrot, Apple, Ginger',
        price: 120.00,
        description: 'A powerful blend of earthy beetroot, sweet carrot, crisp apple, and warming ginger. Naturally boosts energy and supports athletic performance.',
        category: 'Veggie Fusion',
        tags: ['energy', 'athletic', 'natural', 'Performance Boost', 'Daily Wellness'],
        image: '/images/juice-5.jpeg',
        data_ai_hint: 'beetroot carrot juice',
        stock_quantity: 40
      },
      {
        name: 'Citrus Zing',
        flavor: 'Orange, Grapefruit, Lemon, Mint',
        price: 120.00,
        description: 'A zesty and invigorating blend of fresh citrus fruits with a cooling mint finish. Perfect for an afternoon pick-me-up.',
        category: 'Fruit Blast',
        tags: ['citrus', 'refreshing', 'energizing', 'Immunity Booster', 'Morning Energy'],
        image: '/images/juice-6.jpeg',
        data_ai_hint: 'citrus juice',
        stock_quantity: 60
      },
      {
        name: 'Detox Green Supreme',
        flavor: 'Cucumber, Celery, Spinach, Lemon, Parsley',
        price: 120.00,
        description: 'The ultimate green detox blend with hydrating cucumber, cleansing celery, nutrient-rich spinach, and fresh herbs.',
        category: 'Green Power',
        tags: ['detox', 'cleansing', 'hydrating', 'Detoxify', 'Radiant Health'],
        image: '/images/juice-7.jpeg',
        data_ai_hint: 'green detox juice',
        stock_quantity: 35
      },
      {
        name: 'Purple Power',
        flavor: 'Blackberry, Blueberry, Grape, Acai',
        price: 120.00,
        description: 'A antioxidant-rich purple powerhouse featuring berries and superfruit acai for maximum nutrition and flavor.',
        category: 'Fruit Blast',
        tags: ['antioxidant', 'superfruit', 'purple', 'Skin Glow', 'Immunity Booster'],
        image: '/images/juice-8.jpeg',
        data_ai_hint: 'purple berry juice',
        stock_quantity: 25
      },
      {
        name: 'Golden Glow',
        flavor: 'Turmeric, Ginger, Carrot, Orange, Honey',
        price: 120.00,
        description: 'An anti-inflammatory golden blend featuring turmeric, warming ginger, and sweet carrot with a touch of honey.',
        category: 'Veggie Fusion',
        tags: ['anti-inflammatory', 'golden', 'warming', 'Radiant Health', 'Immunity Booster'],
        image: '/images/juice-9.jpeg',
        data_ai_hint: 'turmeric ginger juice',
        stock_quantity: 45
      },
      {
        name: 'Watermelon Mint Refresh',
        flavor: 'Watermelon, Mint, Lime, Coconut Water',
        price: 120.00,
        description: 'A hydrating summer blend of sweet watermelon, cooling mint, zesty lime, and pure coconut water.',
        category: 'Exotic Flavors',
        tags: ['hydrating', 'summer', 'refreshing', 'Seasonal Specials', 'Vacation Vibes'],
        image: '/images/juice-10.jpeg',
        data_ai_hint: 'watermelon mint drink',
        stock_quantity: 20
      }
    ];

    const { data, error: insertError } = await supabase
      .from('juices')
      .insert(juices)
      .select();

    if (insertError) {
      console.error('❌ Error inserting juice data:', insertError.message);
      return;
    }

    console.log(`✅ Successfully inserted ${data.length} juices!`);
    
    // Verify the data
    console.log('\n4️⃣ Verifying juice data...');
    const { data: allJuices, error: fetchError } = await supabase
      .from('juices')
      .select('id, name, category, stock_quantity')
      .order('name');

    if (fetchError) {
      console.error('❌ Error fetching juices:', fetchError.message);
      return;
    }

    console.log('✅ Current juices in database:');
    allJuices.forEach(juice => {
      console.log(`   - ${juice.name} (${juice.category}) - Stock: ${juice.stock_quantity}`);
    });

    console.log('\n🎉 Juices table update completed successfully!');

  } catch (error) {
    console.error('💥 Error updating juices table:', error);
  }
}

updateJuicesTable();

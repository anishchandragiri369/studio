// Script to analyze juices table schema and create schema if needed
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables not found');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeJuicesTable() {
  console.log('🔍 Analyzing juices table schema...\n');

  try {
    // Try to fetch a sample juice to see current schema
    const { data: sampleJuice, error: fetchError } = await supabase
      .from('juices')
      .select('*')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('❌ Error fetching sample juice:', fetchError);
      console.log('\n📋 Table may not exist. Here\'s the schema we need:');
      generateJuicesTableSchema();
      return;
    }

    if (sampleJuice) {
      console.log('✅ Juices table exists! Sample juice:');
      console.log('Columns present:', Object.keys(sampleJuice));
      console.log('Sample data:', JSON.stringify(sampleJuice, null, 2));
      
      // Check for required columns
      const requiredColumns = [
        'id', 'name', 'flavor', 'price', 'description', 'category', 
        'tags', 'image_url', 'data_ai_hint', 'stock_quantity', 'is_active'
      ];
      
      const missingColumns = requiredColumns.filter(col => !(col in sampleJuice));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  Missing columns:', missingColumns);
        generateMigrationForMissingColumns(missingColumns);
      } else {
        console.log('\n✅ All required columns are present!');
      }
    } else {
      console.log('ℹ️  No juices found in database');
      console.log('📋 We need to create sample data');
      generateSampleJuicesData();
    }

    // Test if we can fetch all juices
    console.log('\n🧪 Testing fetch all juices...');
    const { data: allJuices, error: allError } = await supabase
      .from('juices')
      .select('id, name, price, stock_quantity')
      .eq('is_active', true);

    if (allError) {
      console.log('❌ Error fetching all juices:', allError.message);
    } else {
      console.log(`✅ Successfully fetched ${allJuices?.length || 0} active juices`);
      if (allJuices && allJuices.length > 0) {
        allJuices.forEach(juice => {
          console.log(`   - ${juice.name} (₹${juice.price}) - Stock: ${juice.stock_quantity}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

function generateJuicesTableSchema() {
  console.log(`
-- Create juices table with comprehensive details
CREATE TABLE IF NOT EXISTS juices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    flavor VARCHAR(200) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    tags TEXT[], -- Array of tags
    image_url VARCHAR(500),
    data_ai_hint VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_juices_category ON juices(category);
CREATE INDEX IF NOT EXISTS idx_juices_is_active ON juices(is_active);
CREATE INDEX IF NOT EXISTS idx_juices_stock ON juices(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_juices_price ON juices(price);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_juices_updated_at 
    BEFORE UPDATE ON juices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE juices ENABLE ROW LEVEL SECURITY;

-- Public read access for juices
CREATE POLICY "juices_select_policy" ON juices FOR SELECT USING (true);

-- Admin-only write access (uncomment if you have an admins table)
-- CREATE POLICY "juices_admin_policy" ON juices FOR ALL USING (
--     EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email')
-- );

COMMENT ON TABLE juices IS 'Stores juice products with pricing and inventory information';
  `);
}

function generateMigrationForMissingColumns(missingColumns) {
  console.log('\n📋 Migration SQL for missing columns:');
  console.log('-- Add missing columns to juices table\n');
  
  const columnDefinitions = {
    'name': 'ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT \'Unnamed Juice\'',
    'flavor': 'ADD COLUMN IF NOT EXISTS flavor VARCHAR(200) NOT NULL DEFAULT \'Mixed\'',
    'price': 'ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 120.00',
    'description': 'ADD COLUMN IF NOT EXISTS description TEXT',
    'category': 'ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT \'Uncategorized\'',
    'tags': 'ADD COLUMN IF NOT EXISTS tags TEXT[]',
    'image_url': 'ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)',
    'data_ai_hint': 'ADD COLUMN IF NOT EXISTS data_ai_hint VARCHAR(100)',
    'stock_quantity': 'ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0',
    'is_active': 'ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true'
  };

  missingColumns.forEach(column => {
    if (columnDefinitions[column]) {
      console.log(`ALTER TABLE juices ${columnDefinitions[column]};`);
    }
  });
}

function generateSampleJuicesData() {
  console.log('\n📋 Sample juices data to insert:');
  console.log(`
INSERT INTO juices (name, flavor, price, description, category, tags, image_url, data_ai_hint, stock_quantity) VALUES 
('Rejoice', 'Pomegranate, Grape, Strawberry, Dragon Fruit', 120.00, 'A vibrant blend of sweet pomegranate, grapes, and a spicy kick of ginger. Perfect to start your day.', 'Fruit Blast', ARRAY['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'], '/images/juice-1.jpeg', 'pomegranate grape juice', 50),
('Green Vitality', 'Kale, Spinach, Apple, Lemon', 120.00, 'Packed with leafy greens, crisp apple, and zesty lemon for a refreshing and nutritious boost.', 'Green Power', ARRAY['detox', 'healthy', 'greens', 'Immunity Booster', 'Radiant Health', 'Detoxify', 'Daily Wellness'], '/images/juice-2.jpeg', 'green smoothie', 75),
('Berry Bliss', 'Strawberry, Blueberry, Raspberry, Banana', 120.00, 'A delightful mix of sweet berries and creamy banana, rich in antioxidants.', 'Fruit Blast', ARRAY['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'], '/images/juice-3.jpeg', 'berry smoothie', 5),
('Tropical Escape', 'Pineapple, Mango, Coconut Water', 120.00, 'Experience a taste of the tropics with this exotic blend of pineapple, mango, and hydrating coconut water.', 'Exotic Flavors', ARRAY['tropical', 'hydrating', 'refreshing', 'Energy Kick', 'Seasonal Specials'], '/images/juice-4.jpeg', 'tropical drink', 60),
('Beet Boost', 'Beetroot, Apple, Carrot, Lemon', 120.00, 'An earthy and energizing juice featuring beetroot, balanced with sweet apple and carrot.', 'Veggie Fusion', ARRAY['earthy', 'stamina', 'nutrient-rich', 'Workout Fuel', 'Detoxify'], '/images/juice-5.jpeg', 'beet juice', 0),
('Citrus Zing', 'Grapefruit, Orange, Lemon, Lime', 120.00, 'A zesty and invigorating explosion of citrus fruits, perfect for a pick-me-up.', 'Fruit Blast', ARRAY['tangy', 'refreshing', 'vitamin c', 'Immunity Booster', 'Daily Wellness', 'Energy Kick'], '/images/juice-6.jpeg', 'citrus juice', 40);
  `);
}

// Run the analysis
if (require.main === module) {
  analyzeJuicesTable()
    .then(() => {
      console.log('\n✨ Juices table analysis completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeJuicesTable };

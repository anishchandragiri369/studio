-- Create proper juices table schema and populate with juice data
-- This will update the existing juices table with proper structure and data

-- Add missing columns if they don't exist
ALTER TABLE juices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE juices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Clear any existing non-juice data
DELETE FROM juices WHERE category IN ('Fruit Bowls', 'Detox Plans');

-- Delete all existing data to start fresh with proper juice data
DELETE FROM juices;

-- Insert proper juice data matching the constants.ts structure
INSERT INTO juices (name, flavor, price, description, category, tags, image, data_ai_hint, stock_quantity, is_active) VALUES
(
    'Rejoice',
    'pomogranate, grape, strawberry, dragon',
    120.00,
    'A vibrant blend of sweet pomogranate, grapes, and a spicy kick of ginger. Perfect to start your day.',
    'Fruit Blast',
    ARRAY['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'],
    '/images/juice-1.jpeg',
    'pomogranate grape juice',
    50,
    true
),
(
    'Green Vitality',
    'Kale, Spinach, Apple, Lemon',
    120.00,
    'Packed with leafy greens, crisp apple, and zesty lemon for a refreshing and nutritious boost.',
    'Green Power',
    ARRAY['detox', 'healthy', 'greens', 'Immunity Booster', 'Radiant Health', 'Detoxify', 'Daily Wellness'],
    '/images/juice-2.jpeg',
    'green smoothie',
    75,
    true
),
(
    'Berry Bliss',
    'Strawberry, Blueberry, Raspberry, Banana',
    120.00,
    'A delightful mix of sweet berries and creamy banana, rich in antioxidants.',
    'Fruit Blast',
    ARRAY['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'],
    '/images/juice-3.jpeg',
    'berry smoothie',
    5,
    true
),
(
    'Tropical Escape',
    'Pineapple, Mango, Coconut Water',
    120.00,
    'Experience a taste of the tropics with this exotic blend of pineapple, mango, and hydrating coconut water.',
    'Exotic Flavors',
    ARRAY['tropical', 'hydrating', 'exotic', 'Vacation Vibes'],
    '/images/juice-4.jpeg',
    'tropical drink',
    30,
    true
),
(
    'Beet Boost',
    'Beetroot, Carrot, Apple, Ginger',
    120.00,
    'A powerful blend of earthy beetroot, sweet carrot, crisp apple, and warming ginger. Naturally boosts energy and supports athletic performance.',
    'Veggie Fusion',
    ARRAY['energy', 'athletic', 'natural', 'Performance Boost', 'Daily Wellness'],
    '/images/juice-5.jpeg',
    'beetroot carrot juice',
    40,
    true
),
(
    'Citrus Zing',
    'Orange, Grapefruit, Lemon, Mint',
    120.00,
    'A zesty and invigorating blend of fresh citrus fruits with a cooling mint finish. Perfect for an afternoon pick-me-up.',
    'Fruit Blast',
    ARRAY['citrus', 'refreshing', 'energizing', 'Immunity Booster', 'Morning Energy'],
    '/images/juice-6.jpeg',
    'citrus juice',
    60,
    true
),
(
    'Detox Green Supreme',
    'Cucumber, Celery, Spinach, Lemon, Parsley',
    120.00,
    'The ultimate green detox blend with hydrating cucumber, cleansing celery, nutrient-rich spinach, and fresh herbs.',
    'Green Power',
    ARRAY['detox', 'cleansing', 'hydrating', 'Detoxify', 'Radiant Health'],
    '/images/juice-7.jpeg',
    'green detox juice',
    35,
    true
),
(
    'Purple Power',
    'Blackberry, Blueberry, Grape, Acai',
    120.00,
    'A antioxidant-rich purple powerhouse featuring berries and superfruit acai for maximum nutrition and flavor.',
    'Fruit Blast',
    ARRAY['antioxidant', 'superfruit', 'purple', 'Skin Glow', 'Immunity Booster'],
    '/images/juice-8.jpeg',
    'purple berry juice',
    25,
    true
),
(
    'Golden Glow',
    'Turmeric, Ginger, Carrot, Orange, Honey',
    120.00,
    'An anti-inflammatory golden blend featuring turmeric, warming ginger, and sweet carrot with a touch of honey.',
    'Veggie Fusion',
    ARRAY['anti-inflammatory', 'golden', 'warming', 'Radiant Health', 'Immunity Booster'],
    '/images/juice-9.jpeg',
    'turmeric ginger juice',
    45,
    true
),
(
    'Watermelon Mint Refresh',
    'Watermelon, Mint, Lime, Coconut Water',
    120.00,
    'A hydrating summer blend of sweet watermelon, cooling mint, zesty lime, and pure coconut water.',
    'Exotic Flavors',
    ARRAY['hydrating', 'summer', 'refreshing', 'Seasonal Specials', 'Vacation Vibes'],
    '/images/juice-10.jpeg',
    'watermelon mint drink',
    20,
    true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_juices_category ON juices(category);
CREATE INDEX IF NOT EXISTS idx_juices_is_active ON juices(is_active);
CREATE INDEX IF NOT EXISTS idx_juices_stock ON juices(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_juices_tags ON juices USING GIN(tags);

-- Add comment to document the table
COMMENT ON TABLE juices IS 'Fresh juice products available for individual purchase and subscription plans';

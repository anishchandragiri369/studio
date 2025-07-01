-- Create fruit_bowls table with comprehensive details
CREATE TABLE IF NOT EXISTS fruit_bowls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ingredients JSONB NOT NULL, -- Array of ingredients with quantities
    nutritional_info JSONB NOT NULL, -- Calories, vitamins, etc.
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(50) DEFAULT 'Fruit Bowl',
    serving_size VARCHAR(50) NOT NULL, -- e.g., "Large", "Regular"
    preparation_time INTEGER NOT NULL, -- in minutes
    allergen_info TEXT[], -- Array of allergens
    dietary_tags TEXT[], -- e.g., ["vegan", "gluten-free", "organic"]
    seasonal_availability BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fruit_bowl_subscription_plans table
CREATE TABLE IF NOT EXISTS fruit_bowl_subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
    duration_weeks INTEGER NOT NULL, -- 1 for weekly, 4 for monthly
    min_bowls_per_delivery INTEGER DEFAULT 1,
    max_bowls_per_delivery INTEGER DEFAULT 2,
    price_per_week DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    deliveries_per_week INTEGER DEFAULT 7, -- Daily delivery by default
    customization_allowed BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_fruit_bowl_subscriptions table
CREATE TABLE IF NOT EXISTS user_fruit_bowl_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES fruit_bowl_subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    next_delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_address JSONB NOT NULL,
    selected_bowls JSONB NOT NULL, -- Daily bowl selections
    special_instructions TEXT,
    pause_date TIMESTAMP WITH TIME ZONE,
    pause_reason TEXT,
    reactivation_deadline TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fruit_bowl_subscription_deliveries table
CREATE TABLE IF NOT EXISTS fruit_bowl_subscription_deliveries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID REFERENCES user_fruit_bowl_subscriptions(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- e.g., "8:00 AM - 10:00 AM"
    bowls JSONB NOT NULL, -- Array of bowl selections for the day
    quantity_per_bowl JSONB NOT NULL, -- Quantities for each bowl
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'preparing', 'out_for_delivery', 'delivered', 'skipped', 'failed')),
    delivery_notes TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_person VARCHAR(100),
    tracking_info JSONB,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fruit_bowl_customizations table (for user preferences)
CREATE TABLE IF NOT EXISTS fruit_bowl_customizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bowl_id UUID REFERENCES fruit_bowls(id) ON DELETE CASCADE,
    customizations JSONB NOT NULL, -- Custom ingredient modifications
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, bowl_id)
);

-- Insert sample fruit bowls
INSERT INTO fruit_bowls (name, description, ingredients, nutritional_info, price, serving_size, preparation_time, allergen_info, dietary_tags, stock_quantity) VALUES 
(
    'Tropical Paradise Bowl',
    'A vibrant tropical fruit bowl featuring fresh mango, pineapple, kiwi, and passion fruit, topped with coconut flakes and chia seeds for added nutrition.',
    '{
        "fruits": [
            {"name": "Mango", "quantity": "150g", "organic": true},
            {"name": "Pineapple", "quantity": "120g", "organic": true},
            {"name": "Kiwi", "quantity": "80g", "organic": false},
            {"name": "Passion Fruit", "quantity": "50g", "organic": true}
        ],
        "toppings": [
            {"name": "Coconut Flakes", "quantity": "15g"},
            {"name": "Chia Seeds", "quantity": "10g"},
            {"name": "Fresh Mint", "quantity": "5g"}
        ]
    }',
    '{
        "calories": 285,
        "protein": "4.2g",
        "carbs": "68g",
        "fiber": "12g",
        "sugar": "52g",
        "fat": "3.8g",
        "vitamins": {
            "vitamin_c": "180% DV",
            "vitamin_a": "25% DV",
            "potassium": "15% DV"
        }
    }',
    150.00,
    'Regular (400g)',
    5,
    ARRAY['coconut'],
    ARRAY['vegan', 'gluten-free', 'dairy-free', 'organic', 'superfood'],
    50
),
(
    'Berry Antioxidant Bowl',
    'Power-packed bowl with mixed berries, banana, and granola, drizzled with honey and topped with almond slices for a perfect morning boost.',
    '{
        "fruits": [
            {"name": "Strawberries", "quantity": "100g", "organic": true},
            {"name": "Blueberries", "quantity": "80g", "organic": true},
            {"name": "Raspberries", "quantity": "60g", "organic": true},
            {"name": "Blackberries", "quantity": "40g", "organic": true},
            {"name": "Banana", "quantity": "120g", "organic": false}
        ],
        "toppings": [
            {"name": "Homemade Granola", "quantity": "30g"},
            {"name": "Raw Honey", "quantity": "15g"},
            {"name": "Sliced Almonds", "quantity": "20g"}
        ]
    }',
    '{
        "calories": 320,
        "protein": "8.5g",
        "carbs": "58g",
        "fiber": "14g",
        "sugar": "38g",
        "fat": "9.2g",
        "vitamins": {
            "vitamin_c": "120% DV",
            "vitamin_k": "35% DV",
            "manganese": "40% DV"
        }
    }',
    180.00,
    'Regular (400g)',
    3,
    ARRAY['nuts', 'honey'],
    ARRAY['vegetarian', 'antioxidant-rich', 'high-fiber', 'energy-boost'],
    40
),
(
    'Green Goddess Bowl',
    'Nutritious green bowl with avocado, green grapes, apple, spinach, and cucumber, topped with pumpkin seeds and a lime-mint dressing.',
    '{
        "fruits": [
            {"name": "Avocado", "quantity": "100g", "organic": true},
            {"name": "Green Grapes", "quantity": "120g", "organic": false},
            {"name": "Green Apple", "quantity": "150g", "organic": true},
            {"name": "Cucumber", "quantity": "80g", "organic": true}
        ],
        "greens": [
            {"name": "Baby Spinach", "quantity": "40g", "organic": true}
        ],
        "toppings": [
            {"name": "Pumpkin Seeds", "quantity": "15g"},
            {"name": "Lime-Mint Dressing", "quantity": "20g"},
            {"name": "Microgreens", "quantity": "10g"}
        ]
    }',
    '{
        "calories": 295,
        "protein": "6.8g",
        "carbs": "45g",
        "fiber": "16g",
        "sugar": "28g",
        "fat": "12.5g",
        "vitamins": {
            "vitamin_k": "150% DV",
            "folate": "45% DV",
            "vitamin_c": "85% DV",
            "potassium": "25% DV"
        }
    }',
    170.00,
    'Regular (400g)',
    4,
    ARRAY['seeds'],
    ARRAY['vegan', 'gluten-free', 'dairy-free', 'keto-friendly', 'detox', 'low-sugar'],
    35
);

-- Insert fruit bowl subscription plans
INSERT INTO fruit_bowl_subscription_plans (name, description, frequency, duration_weeks, min_bowls_per_delivery, max_bowls_per_delivery, price_per_week, total_price, deliveries_per_week) VALUES 
(
    'Weekly Fresh Bowl Plan',
    'Get fresh fruit bowls delivered daily for a week. Choose 1-2 different bowls per day to keep your healthy routine exciting and varied.',
    'weekly',
    1,
    1,
    2,
    850.00,
    850.00,
    7
),
(
    'Monthly Wellness Bowl Plan',
    'A full month of daily fresh fruit bowls delivered to your doorstep. Perfect for maintaining a consistent healthy lifestyle with maximum variety and savings.',
    'monthly',
    4,
    1,
    2,
    750.00,
    3000.00,
    7
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fruit_bowls_category ON fruit_bowls(category);
CREATE INDEX IF NOT EXISTS idx_fruit_bowls_is_active ON fruit_bowls(is_active);
CREATE INDEX IF NOT EXISTS idx_fruit_bowls_stock ON fruit_bowls(stock_quantity);

CREATE INDEX IF NOT EXISTS idx_fruit_bowl_subscription_plans_frequency ON fruit_bowl_subscription_plans(frequency);
CREATE INDEX IF NOT EXISTS idx_fruit_bowl_subscription_plans_is_active ON fruit_bowl_subscription_plans(is_active);

CREATE INDEX IF NOT EXISTS idx_user_fruit_bowl_subscriptions_user_id ON user_fruit_bowl_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fruit_bowl_subscriptions_status ON user_fruit_bowl_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_fruit_bowl_subscriptions_next_delivery ON user_fruit_bowl_subscriptions(next_delivery_date);

CREATE INDEX IF NOT EXISTS idx_fruit_bowl_deliveries_subscription_id ON fruit_bowl_subscription_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_fruit_bowl_deliveries_date ON fruit_bowl_subscription_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_fruit_bowl_deliveries_status ON fruit_bowl_subscription_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_fruit_bowl_customizations_user_id ON fruit_bowl_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_fruit_bowl_customizations_bowl_id ON fruit_bowl_customizations(bowl_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_fruit_bowls_updated_at 
    BEFORE UPDATE ON fruit_bowls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fruit_bowl_subscription_plans_updated_at 
    BEFORE UPDATE ON fruit_bowl_subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fruit_bowl_subscriptions_updated_at 
    BEFORE UPDATE ON user_fruit_bowl_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fruit_bowl_subscription_deliveries_updated_at 
    BEFORE UPDATE ON fruit_bowl_subscription_deliveries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fruit_bowl_customizations_updated_at 
    BEFORE UPDATE ON fruit_bowl_customizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE fruit_bowls ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_bowl_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fruit_bowl_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_bowl_subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fruit_bowl_customizations ENABLE ROW LEVEL SECURITY;

-- Public read access for fruit bowls and plans
CREATE POLICY "fruit_bowls_select_policy" ON fruit_bowls FOR SELECT USING (true);
CREATE POLICY "fruit_bowl_subscription_plans_select_policy" ON fruit_bowl_subscription_plans FOR SELECT USING (true);

-- Users can only access their own subscriptions
CREATE POLICY "user_fruit_bowl_subscriptions_policy" ON user_fruit_bowl_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "fruit_bowl_subscription_deliveries_policy" ON fruit_bowl_subscription_deliveries 
    FOR ALL USING (
        subscription_id IN (
            SELECT id FROM user_fruit_bowl_subscriptions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "fruit_bowl_customizations_policy" ON fruit_bowl_customizations 
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies (for admin users)
CREATE POLICY "fruit_bowls_admin_policy" ON fruit_bowls FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email')
);

CREATE POLICY "fruit_bowl_subscription_plans_admin_policy" ON fruit_bowl_subscription_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email')
);

COMMENT ON TABLE fruit_bowls IS 'Stores fruit bowl products with detailed nutritional and ingredient information';
COMMENT ON TABLE fruit_bowl_subscription_plans IS 'Defines subscription plans for fruit bowl deliveries (weekly/monthly)';
COMMENT ON TABLE user_fruit_bowl_subscriptions IS 'User fruit bowl subscriptions with customization options';
COMMENT ON TABLE fruit_bowl_subscription_deliveries IS 'Individual delivery records for fruit bowl subscriptions';
COMMENT ON TABLE fruit_bowl_customizations IS 'User preferences and customizations for fruit bowls';

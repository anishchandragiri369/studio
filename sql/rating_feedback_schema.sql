-- Customer Rating and Feedback System Database Schema
-- Run these SQL commands in your Supabase SQL editor

-- 1. Order ratings table
CREATE TABLE IF NOT EXISTS order_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    feedback_text TEXT,
    anonymous BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Product ratings table (for individual juice ratings)
CREATE TABLE IF NOT EXISTS product_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    juice_id VARCHAR(50) NOT NULL, -- References juice ID from the items
    juice_name VARCHAR(255) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
    freshness_rating INTEGER CHECK (freshness_rating >= 1 AND freshness_rating <= 5),
    feedback_text TEXT,
    would_recommend BOOLEAN,
    anonymous BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, juice_id, user_id)
);

-- 3. Feedback categories table (for categorizing feedback)
CREATE TABLE IF NOT EXISTS feedback_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Feedback responses table (admin responses to customer feedback)
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID REFERENCES order_ratings(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    response_text TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Rating helpfulness tracking
CREATE TABLE IF NOT EXISTS rating_helpfulness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID REFERENCES order_ratings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rating_id, user_id)
);

-- Insert default feedback categories
INSERT INTO feedback_categories (name, description, icon) VALUES 
('Quality', 'Product quality and freshness', '⭐'),
('Delivery', 'Delivery speed and packaging', '🚚'),
('Service', 'Customer service experience', '🎯'),
('Value', 'Price and value for money', '💰'),
('Taste', 'Flavor and taste experience', '😋'),
('Packaging', 'Product packaging quality', '📦'),
('Other', 'General feedback and suggestions', '💬')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_ratings_order_id ON order_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_user_id ON order_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_rating ON order_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_order_ratings_created_at ON order_ratings(created_at);

CREATE INDEX IF NOT EXISTS idx_product_ratings_juice_id ON product_ratings(juice_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_order_id ON product_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_user_id ON product_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ratings_rating ON product_ratings(rating);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_rating_id ON feedback_responses(rating_id);
CREATE INDEX IF NOT EXISTS idx_rating_helpfulness_rating_id ON rating_helpfulness(rating_id);

-- Create updated_at trigger for order_ratings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_ratings_updated_at BEFORE UPDATE ON order_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_ratings_updated_at BEFORE UPDATE ON product_ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_responses_updated_at BEFORE UPDATE ON feedback_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful_count update trigger for order_ratings
CREATE OR REPLACE FUNCTION update_rating_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_helpful = TRUE THEN
            UPDATE order_ratings SET helpful_count = helpful_count + 1 WHERE id = NEW.rating_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_helpful = TRUE AND NEW.is_helpful = FALSE THEN
            UPDATE order_ratings SET helpful_count = helpful_count - 1 WHERE id = NEW.rating_id;
        ELSIF OLD.is_helpful = FALSE AND NEW.is_helpful = TRUE THEN
            UPDATE order_ratings SET helpful_count = helpful_count + 1 WHERE id = NEW.rating_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_helpful = TRUE THEN
            UPDATE order_ratings SET helpful_count = helpful_count - 1 WHERE id = OLD.rating_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rating_helpful_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON rating_helpfulness
    FOR EACH ROW EXECUTE FUNCTION update_rating_helpful_count();

-- RLS Policies for security
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_helpfulness ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings but only manage their own
CREATE POLICY "Users can view all order ratings" ON order_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own order ratings" ON order_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own order ratings" ON order_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own order ratings" ON order_ratings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view all product ratings" ON product_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own product ratings" ON product_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own product ratings" ON product_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own product ratings" ON product_ratings FOR DELETE USING (auth.uid() = user_id);

-- Feedback categories are read-only for users
CREATE POLICY "Users can view feedback categories" ON feedback_categories FOR SELECT USING (true);

-- Feedback responses are public for reading
CREATE POLICY "Users can view public feedback responses" ON feedback_responses FOR SELECT USING (is_public = true);

-- Rating helpfulness policies
CREATE POLICY "Users can view rating helpfulness" ON rating_helpfulness FOR SELECT USING (true);
CREATE POLICY "Users can manage their own helpfulness votes" ON rating_helpfulness FOR ALL USING (auth.uid() = user_id);

-- Add column to orders table to track if rating has been requested/submitted
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_submitted BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON TABLE order_ratings IS 'Customer ratings and feedback for complete orders';
COMMENT ON TABLE product_ratings IS 'Customer ratings and feedback for individual products/juices';
COMMENT ON TABLE feedback_categories IS 'Categories for organizing customer feedback';
COMMENT ON TABLE feedback_responses IS 'Admin responses to customer feedback';
COMMENT ON TABLE rating_helpfulness IS 'User votes on whether ratings are helpful';
COMMENT ON COLUMN orders.rating_requested IS 'Whether rating has been requested from customer';
COMMENT ON COLUMN orders.rating_submitted IS 'Whether customer has submitted a rating for this order';

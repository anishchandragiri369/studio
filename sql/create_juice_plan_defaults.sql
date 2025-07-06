-- Create table for managing default juices per subscription plan
-- This allows admins to set default juice selections for each plan type

CREATE TABLE IF NOT EXISTS juice_subscription_plan_defaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id VARCHAR(50) NOT NULL, -- e.g., 'weekly-juice', 'monthly-juice'
    juice_id BIGINT NOT NULL,     -- References juices.id (bigint)
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0, -- For ordering juices in the plan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combination of plan and juice
    UNIQUE(plan_id, juice_id),
    
    -- Foreign key constraint
    CONSTRAINT fk_juice_subscription_plan_defaults_juice 
        FOREIGN KEY (juice_id) REFERENCES juices(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_juice_plan_defaults_plan_id ON juice_subscription_plan_defaults(plan_id);
CREATE INDEX IF NOT EXISTS idx_juice_plan_defaults_juice_id ON juice_subscription_plan_defaults(juice_id);
CREATE INDEX IF NOT EXISTS idx_juice_plan_defaults_active ON juice_subscription_plan_defaults(is_active);
CREATE INDEX IF NOT EXISTS idx_juice_plan_defaults_sort ON juice_subscription_plan_defaults(plan_id, sort_order);

-- Create trigger for updated_at
CREATE TRIGGER update_juice_plan_defaults_updated_at 
    BEFORE UPDATE ON juice_subscription_plan_defaults 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample default juices for weekly and monthly plans
-- Using the correct juice IDs from your database
INSERT INTO juice_subscription_plan_defaults (plan_id, juice_id, quantity, sort_order) VALUES
-- Weekly Juice Plan Defaults
('weekly-juice', 21, 2, 1),  -- Rejoice (2 bottles)
('weekly-juice', 22, 1, 2),  -- Green Vitality (1 bottle)
('weekly-juice', 23, 1, 3),  -- Berry Bliss (1 bottle)
('weekly-juice', 24, 1, 4),  -- Tropical Escape (1 bottle)
('weekly-juice', 25, 1, 5),  -- Beet Boost (1 bottle)
('weekly-juice', 26, 1, 6),  -- Citrus Zing (1 bottle)

-- Monthly Juice Plan Defaults  
('monthly-juice', 21, 3, 1),  -- Rejoice (3 bottles)
('monthly-juice', 22, 2, 2),  -- Green Vitality (2 bottles)
('monthly-juice', 23, 2, 3),  -- Berry Bliss (2 bottles)
('monthly-juice', 24, 2, 4),  -- Tropical Escape (2 bottles)
('monthly-juice', 25, 2, 5),  -- Beet Boost (2 bottles)
('monthly-juice', 26, 2, 6),  -- Citrus Zing (2 bottles)
('monthly-juice', 27, 1, 7),  -- Detox Green Supreme (1 bottle)
('monthly-juice', 28, 1, 8),  -- Purple Power (1 bottle)
('monthly-juice', 29, 1, 9),  -- Golden Glow (1 bottle)
('monthly-juice', 30, 1, 10); -- Watermelon Mint Refresh (1 bottle)

-- Add comments
COMMENT ON TABLE juice_subscription_plan_defaults IS 'Default juice selections for each subscription plan type, manageable by admins';
COMMENT ON COLUMN juice_subscription_plan_defaults.plan_id IS 'Subscription plan identifier (e.g., weekly-juice, monthly-juice)';
COMMENT ON COLUMN juice_subscription_plan_defaults.juice_id IS 'Reference to juices table ID';
COMMENT ON COLUMN juice_subscription_plan_defaults.quantity IS 'Default quantity of this juice for the plan';
COMMENT ON COLUMN juice_subscription_plan_defaults.sort_order IS 'Order in which juices appear in the plan customization UI';

-- Enable RLS (Row Level Security) for admin-only access
ALTER TABLE juice_subscription_plan_defaults ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Public read access (needed for plan customization UI)
CREATE POLICY "juice_plan_defaults_select_policy" ON juice_subscription_plan_defaults 
    FOR SELECT USING (true);

-- Admin-only insert/update/delete (using is_active column that you added)
CREATE POLICY "juice_plan_defaults_admin_policy" ON juice_subscription_plan_defaults 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.user_id = auth.uid() 
            AND admins.is_active = true
        )
    ); 
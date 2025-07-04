-- Minimal Delivery Schedule Settings Setup
-- Run this if you're having issues with the full migration script

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_delivery_schedule_settings();
DROP FUNCTION IF EXISTS get_delivery_schedule_audit_history(VARCHAR(50), INTEGER);
DROP FUNCTION IF EXISTS calculate_next_delivery_date(VARCHAR(50), TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS update_delivery_schedule_setting(VARCHAR(50), INTEGER, BOOLEAN, TEXT, TEXT, VARCHAR(255));

-- Drop and recreate tables (careful - this will lose data!)
-- Uncomment only if you want to start fresh
-- DROP TABLE IF EXISTS delivery_schedule_audit;
-- DROP TABLE IF EXISTS delivery_schedule_settings;

-- Create delivery schedule settings table
CREATE TABLE IF NOT EXISTS delivery_schedule_settings (
    id SERIAL PRIMARY KEY,
    subscription_type VARCHAR(50) NOT NULL UNIQUE CHECK (subscription_type IN ('juices', 'fruit_bowls', 'customized')),
    delivery_gap_days INTEGER NOT NULL DEFAULT 1 CHECK (delivery_gap_days >= 1 AND delivery_gap_days <= 30),
    is_daily BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- Create audit table
CREATE TABLE IF NOT EXISTS delivery_schedule_audit (
    id SERIAL PRIMARY KEY,
    schedule_settings_id INTEGER REFERENCES delivery_schedule_settings(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL,
    old_delivery_gap_days INTEGER,
    new_delivery_gap_days INTEGER,
    old_is_daily BOOLEAN,
    new_is_daily BOOLEAN,
    changed_by VARCHAR(255),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings (will not duplicate if already exists)
INSERT INTO delivery_schedule_settings (subscription_type, delivery_gap_days, is_daily, description) 
VALUES
('juices', 1, false, 'Every other day delivery schedule for juice subscriptions'),
('fruit_bowls', 1, true, 'Daily delivery schedule for fruit bowl subscriptions'),
('customized', 2, false, 'Every 3 days delivery schedule for customized subscriptions')
ON CONFLICT (subscription_type) DO NOTHING;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_settings_type ON delivery_schedule_settings(subscription_type);
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_settings_active ON delivery_schedule_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_audit_type ON delivery_schedule_audit(subscription_type);
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_audit_date ON delivery_schedule_audit(created_at);

-- Create simple updated_at trigger function
CREATE OR REPLACE FUNCTION update_delivery_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_delivery_schedule_settings_updated_at ON delivery_schedule_settings;
CREATE TRIGGER update_delivery_schedule_settings_updated_at 
    BEFORE UPDATE ON delivery_schedule_settings 
    FOR EACH ROW EXECUTE FUNCTION update_delivery_schedule_updated_at();

-- Verify setup
SELECT 'Minimal setup complete!' as status;

-- Show current settings
SELECT 
    subscription_type,
    delivery_gap_days,
    is_daily,
    description,
    is_active
FROM delivery_schedule_settings
ORDER BY 
    CASE subscription_type 
        WHEN 'juices' THEN 1
        WHEN 'fruit_bowls' THEN 2
        WHEN 'customized' THEN 3
        ELSE 4
    END;

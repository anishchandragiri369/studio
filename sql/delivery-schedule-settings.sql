-- Delivery Schedule Settings System
-- Allows admin to control delivery gaps for different subscription types

-- Create delivery schedule settings table
CREATE TABLE IF NOT EXISTS delivery_schedule_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_type VARCHAR(50) NOT NULL UNIQUE CHECK (subscription_type IN ('juices', 'fruit_bowls', 'customized')),
    delivery_gap_days INTEGER NOT NULL DEFAULT 1 CHECK (delivery_gap_days >= 1 AND delivery_gap_days <= 30),
    is_daily BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID -- Removed foreign key constraint for compatibility
);

-- Create audit table for delivery schedule changes
CREATE TABLE IF NOT EXISTS delivery_schedule_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_settings_id UUID REFERENCES delivery_schedule_settings(id) ON DELETE CASCADE,
    subscription_type VARCHAR(50) NOT NULL,
    old_delivery_gap_days INTEGER,
    new_delivery_gap_days INTEGER,
    old_is_daily BOOLEAN,
    new_is_daily BOOLEAN,
    changed_by UUID, -- Removed foreign key constraint for compatibility
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings for each subscription type
INSERT INTO delivery_schedule_settings (subscription_type, delivery_gap_days, is_daily, description) VALUES
('juices', 7, false, 'Weekly delivery schedule for juice subscriptions with 7-day gap'),
('fruit_bowls', 1, true, 'Daily delivery schedule for fruit bowl subscriptions'),
('customized', 3, false, 'Every 3 days delivery schedule for customized subscriptions (default)')
ON CONFLICT (subscription_type) DO UPDATE SET
    delivery_gap_days = EXCLUDED.delivery_gap_days,
    is_daily = EXCLUDED.is_daily,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Create function to update delivery schedule settings
CREATE OR REPLACE FUNCTION update_delivery_schedule_setting(
    p_subscription_type VARCHAR(50),
    p_delivery_gap_days INTEGER,
    p_is_daily BOOLEAN,
    p_description TEXT DEFAULT NULL,
    p_change_reason TEXT DEFAULT NULL,
    p_admin_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_old_record delivery_schedule_settings%ROWTYPE;
    v_new_record delivery_schedule_settings%ROWTYPE;
    v_result JSON;
BEGIN
    -- Get the current record
    SELECT * INTO v_old_record 
    FROM delivery_schedule_settings 
    WHERE subscription_type = p_subscription_type;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription type % not found', p_subscription_type;
    END IF;
    
    -- Update the record
    UPDATE delivery_schedule_settings 
    SET 
        delivery_gap_days = p_delivery_gap_days,
        is_daily = p_is_daily,
        description = COALESCE(p_description, description),
        updated_at = NOW(),
        updated_by = p_admin_user_id
    WHERE subscription_type = p_subscription_type
    RETURNING * INTO v_new_record;
    
    -- Insert audit record
    INSERT INTO delivery_schedule_audit (
        schedule_settings_id,
        subscription_type,
        old_delivery_gap_days,
        new_delivery_gap_days,
        old_is_daily,
        new_is_daily,
        changed_by,
        change_reason
    ) VALUES (
        v_new_record.id,
        p_subscription_type,
        v_old_record.delivery_gap_days,
        v_new_record.delivery_gap_days,
        v_old_record.is_daily,
        v_new_record.is_daily,
        p_admin_user_id,
        p_change_reason
    );
    
    -- Prepare result
    v_result := json_build_object(
        'success', true,
        'subscription_type', p_subscription_type,
        'old_settings', json_build_object(
            'delivery_gap_days', v_old_record.delivery_gap_days,
            'is_daily', v_old_record.is_daily
        ),
        'new_settings', json_build_object(
            'delivery_gap_days', v_new_record.delivery_gap_days,
            'is_daily', v_new_record.is_daily,
            'description', v_new_record.description
        ),
        'updated_at', v_new_record.updated_at
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get delivery schedule settings
CREATE OR REPLACE FUNCTION get_delivery_schedule_settings()
RETURNS TABLE (
    subscription_type VARCHAR(50),
    delivery_gap_days INTEGER,
    is_daily BOOLEAN,
    description TEXT,
    is_active BOOLEAN,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dss.subscription_type,
        dss.delivery_gap_days,
        dss.is_daily,
        dss.description,
        dss.is_active,
        dss.updated_at,
        COALESCE(dss.updated_by::TEXT, 'System') as updated_by_email
    FROM delivery_schedule_settings dss
    WHERE dss.is_active = true
    ORDER BY 
        CASE dss.subscription_type 
            WHEN 'juices' THEN 1
            WHEN 'fruit_bowls' THEN 2
            WHEN 'customized' THEN 3
            ELSE 4
        END;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next delivery date based on subscription type
CREATE OR REPLACE FUNCTION calculate_next_delivery_date(
    p_subscription_type VARCHAR(50),
    p_current_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_delivery_gap_days INTEGER;
    v_is_daily BOOLEAN;
    v_next_delivery_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the delivery settings for the subscription type
    SELECT delivery_gap_days, is_daily 
    INTO v_delivery_gap_days, v_is_daily
    FROM delivery_schedule_settings 
    WHERE subscription_type = p_subscription_type AND is_active = true;
    
    IF NOT FOUND THEN
        -- Default to 1 day gap if no settings found
        v_delivery_gap_days := 1;
        v_is_daily := true;
    END IF;
    
    -- Calculate next delivery date
    IF v_is_daily THEN
        v_next_delivery_date := p_current_date + INTERVAL '1 day';
    ELSE
        v_next_delivery_date := p_current_date + (v_delivery_gap_days || ' days')::INTERVAL;
    END IF;
    
    RETURN v_next_delivery_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to get delivery schedule audit history
CREATE OR REPLACE FUNCTION get_delivery_schedule_audit_history(
    p_subscription_type VARCHAR(50) DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    subscription_type VARCHAR(50),
    old_delivery_gap_days INTEGER,
    new_delivery_gap_days INTEGER,
    old_is_daily BOOLEAN,
    new_is_daily BOOLEAN,
    changed_by_email TEXT,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dsa.id,
        dsa.subscription_type,
        dsa.old_delivery_gap_days,
        dsa.new_delivery_gap_days,
        dsa.old_is_daily,
        dsa.new_is_daily,
        COALESCE(dsa.changed_by::TEXT, 'Unknown') as changed_by_email,
        dsa.change_reason,
        dsa.created_at
    FROM delivery_schedule_audit dsa
    WHERE (p_subscription_type IS NULL OR dsa.subscription_type = p_subscription_type)
    ORDER BY dsa.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_settings_type ON delivery_schedule_settings(subscription_type);
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_settings_active ON delivery_schedule_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_audit_type ON delivery_schedule_audit(subscription_type);
CREATE INDEX IF NOT EXISTS idx_delivery_schedule_audit_date ON delivery_schedule_audit(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_delivery_schedule_settings_updated_at 
    BEFORE UPDATE ON delivery_schedule_settings 
    FOR EACH ROW EXECUTE FUNCTION update_delivery_schedule_updated_at();

-- Add RLS policies for admin access (optional - can be enabled later)
-- ALTER TABLE delivery_schedule_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE delivery_schedule_audit ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read/write delivery schedule settings (optional)
-- CREATE POLICY "Admins can manage delivery schedule settings" ON delivery_schedule_settings
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM admins 
--             WHERE user_id = auth.uid() 
--             AND is_active = true
--         )
--     );

-- Policy for admins to read audit history (optional)
-- CREATE POLICY "Admins can read delivery schedule audit" ON delivery_schedule_audit
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM admins 
--             WHERE user_id = auth.uid() 
--             AND is_active = true
--         )
--     );

-- Add comments
COMMENT ON TABLE delivery_schedule_settings IS 'Admin configurable delivery schedule settings for different subscription types';
COMMENT ON TABLE delivery_schedule_audit IS 'Audit trail for delivery schedule setting changes';
COMMENT ON FUNCTION update_delivery_schedule_setting IS 'Updates delivery schedule settings with audit logging';
COMMENT ON FUNCTION get_delivery_schedule_settings IS 'Returns all active delivery schedule settings';
COMMENT ON FUNCTION calculate_next_delivery_date IS 'Calculates next delivery date based on subscription type settings';
COMMENT ON FUNCTION get_delivery_schedule_audit_history IS 'Returns audit history of delivery schedule changes';

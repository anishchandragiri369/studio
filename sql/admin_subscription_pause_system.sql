/*
 * Admin Subscription Pause System - Database Schema
 * 
 * This script creates the complete admin pause system with proper error handling.
 * Safe to run multiple times - will not fail if objects already exist.
 * 
 * Features:
 * - Admin pause/reactivate functionality
 * - 6 PM cutoff logic for delivery scheduling  
 * - Sunday exclusion in delivery dates
 * - Automatic cleanup of expired pauses
 * - Comprehensive audit logging
 * - Subscription end date extension by pause duration
 */

-- Validation: Check if we're connected to the right database
DO $$ 
BEGIN
    RAISE NOTICE 'Executing admin subscription pause system setup...';
    RAISE NOTICE 'Database: %, User: %', current_database(), current_user;
END $$;

-- Create admin_subscription_pauses table
CREATE TABLE IF NOT EXISTS admin_subscription_pauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pause_type VARCHAR(20) NOT NULL CHECK (pause_type IN ('all', 'selected')),
    affected_user_ids UUID[], -- NULL for 'all', array of user IDs for 'selected'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE, -- NULL for indefinite pause
    reason TEXT NOT NULL,
    admin_user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reactivated', 'cancelled')),
    affected_subscription_count INTEGER NOT NULL DEFAULT 0,
    reactivated_at TIMESTAMP WITH TIME ZONE,
    reactivated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add new columns to user_subscriptions table for admin pause tracking
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS admin_pause_id UUID REFERENCES admin_subscription_pauses(id),
ADD COLUMN IF NOT EXISTS admin_pause_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_pause_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_reactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_reactivated_by UUID;

-- Update status check constraint to include admin_paused
DO $$ 
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_status_check' 
        AND table_name = 'user_subscriptions'
    ) THEN
        ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_status_check;
    END IF;
    
    -- Add updated constraint
    ALTER TABLE user_subscriptions 
    ADD CONSTRAINT user_subscriptions_status_check 
    CHECK (status IN ('active', 'paused', 'expired', 'cancelled', 'admin_paused'));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_subscription_pauses_status 
ON admin_subscription_pauses(status, start_date);

CREATE INDEX IF NOT EXISTS idx_admin_subscription_pauses_admin_user 
ON admin_subscription_pauses(admin_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user 
ON admin_audit_logs(admin_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action 
ON admin_audit_logs(action, created_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_admin_pause 
ON user_subscriptions(admin_pause_id, status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_delivery 
ON user_subscriptions(status, next_delivery_date);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_pause_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger with proper error handling
DO $$ 
BEGIN
    -- Drop trigger if it exists and recreate
    DROP TRIGGER IF EXISTS update_admin_subscription_pauses_updated_at ON admin_subscription_pauses;
    
    CREATE TRIGGER update_admin_subscription_pauses_updated_at
        BEFORE UPDATE ON admin_subscription_pauses
        FOR EACH ROW EXECUTE FUNCTION update_admin_pause_updated_at();
        
    RAISE NOTICE 'Trigger update_admin_subscription_pauses_updated_at created successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Trigger creation: %', SQLERRM;
END $$;

-- Add comments for documentation
COMMENT ON TABLE admin_subscription_pauses IS 'Tracks admin-initiated pauses affecting multiple subscriptions (e.g., holidays, emergencies)';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail for all admin actions on subscriptions and system management';

COMMENT ON COLUMN admin_subscription_pauses.pause_type IS 'Type of pause: "all" for all active subscriptions, "selected" for specific users';
COMMENT ON COLUMN admin_subscription_pauses.affected_user_ids IS 'Array of user IDs for selected pause type, NULL for all pause type';
COMMENT ON COLUMN admin_subscription_pauses.start_date IS 'When the admin pause begins';
COMMENT ON COLUMN admin_subscription_pauses.end_date IS 'When the admin pause ends (NULL for indefinite)';
COMMENT ON COLUMN admin_subscription_pauses.reason IS 'Admin reason for the pause (e.g., "Holiday closure", "Emergency maintenance")';
COMMENT ON COLUMN admin_subscription_pauses.status IS 'Current status of the admin pause';
COMMENT ON COLUMN admin_subscription_pauses.affected_subscription_count IS 'Number of subscriptions affected by this pause';

COMMENT ON COLUMN user_subscriptions.admin_pause_id IS 'References the admin pause record if subscription is admin-paused';
COMMENT ON COLUMN user_subscriptions.admin_pause_start IS 'When admin pause started for this subscription';
COMMENT ON COLUMN user_subscriptions.admin_pause_end IS 'When admin pause ended for this subscription';
COMMENT ON COLUMN user_subscriptions.admin_reactivated_at IS 'When subscription was reactivated by admin';
COMMENT ON COLUMN user_subscriptions.admin_reactivated_by IS 'Admin user ID who reactivated the subscription';

-- Create function to get admin pause summary
CREATE OR REPLACE FUNCTION get_admin_pause_summary()
RETURNS TABLE (
    total_pauses BIGINT,
    active_pauses BIGINT,
    reactivated_pauses BIGINT,
    total_affected_subscriptions BIGINT,
    currently_admin_paused_subscriptions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM admin_subscription_pauses) as total_pauses,
        (SELECT COUNT(*) FROM admin_subscription_pauses WHERE status = 'active') as active_pauses,
        (SELECT COUNT(*) FROM admin_subscription_pauses WHERE status = 'reactivated') as reactivated_pauses,
        (SELECT COALESCE(SUM(affected_subscription_count), 0) FROM admin_subscription_pauses) as total_affected_subscriptions,
        (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'admin_paused') as currently_admin_paused_subscriptions;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate next delivery date with proper scheduling logic
CREATE OR REPLACE FUNCTION calculate_reactivation_delivery_date(
    reactivation_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_delivery TIMESTAMP WITH TIME ZONE;
    reactivation_hour INTEGER;
BEGIN
    -- Get the hour of reactivation
    reactivation_hour := EXTRACT(HOUR FROM reactivation_timestamp);
    
    -- Calculate base delivery date based on 6 PM cutoff
    IF reactivation_hour >= 18 THEN
        -- After 6 PM: schedule for day after next
        next_delivery := (reactivation_timestamp::date + INTERVAL '2 days')::timestamp + TIME '08:00:00';
    ELSE
        -- Before 6 PM: schedule for next day
        next_delivery := (reactivation_timestamp::date + INTERVAL '1 day')::timestamp + TIME '08:00:00';
    END IF;
    
    -- Skip Sunday (move to Monday if delivery falls on Sunday)
    WHILE EXTRACT(DOW FROM next_delivery) = 0 LOOP
        next_delivery := next_delivery + INTERVAL '1 day';
    END LOOP;
    
    RETURN next_delivery;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup expired admin pauses
CREATE OR REPLACE FUNCTION cleanup_expired_admin_pauses()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    pause_record RECORD;
BEGIN
    -- Find admin pauses that have ended but are still marked as active
    FOR pause_record IN 
        SELECT id, end_date 
        FROM admin_subscription_pauses 
        WHERE status = 'active' 
        AND end_date IS NOT NULL 
        AND end_date < NOW()
    LOOP
        -- Update the admin pause status
        UPDATE admin_subscription_pauses 
        SET status = 'reactivated', 
            updated_at = NOW(),
            reactivated_at = pause_record.end_date
        WHERE id = pause_record.id;
        
        -- Reactivate affected subscriptions with proper delivery schedule adjustment
        UPDATE user_subscriptions 
        SET status = 'active',
            admin_pause_id = NULL,
            admin_pause_start = NULL,
            admin_pause_end = pause_record.end_date,
            admin_reactivated_at = pause_record.end_date,
            -- Extend subscription end date by pause duration
            subscription_end_date = subscription_end_date + (pause_record.end_date - admin_pause_start),
            -- Calculate next delivery date with proper 6 PM cutoff logic
            next_delivery_date = calculate_reactivation_delivery_date(pause_record.end_date),
            updated_at = NOW()
        WHERE admin_pause_id = pause_record.id 
        AND status = 'admin_paused';
        
        expired_count := expired_count + 1;
    END LOOP;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions (with error handling)
DO $$ 
BEGIN
    -- Grant permissions with error handling
    BEGIN
        GRANT SELECT, INSERT, UPDATE ON admin_subscription_pauses TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'admin_subscription_pauses permissions: %', SQLERRM;
    END;
    
    BEGIN
        GRANT SELECT, INSERT ON admin_audit_logs TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'admin_audit_logs permissions: %', SQLERRM;
    END;
    
    BEGIN
        GRANT EXECUTE ON FUNCTION get_admin_pause_summary() TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'get_admin_pause_summary permissions: %', SQLERRM;
    END;
    
    BEGIN
        GRANT EXECUTE ON FUNCTION cleanup_expired_admin_pauses() TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'cleanup_expired_admin_pauses permissions: %', SQLERRM;
    END;
    
    BEGIN
        GRANT EXECUTE ON FUNCTION calculate_reactivation_delivery_date(TIMESTAMP WITH TIME ZONE) TO authenticated;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'calculate_reactivation_delivery_date permissions: %', SQLERRM;
    END;
END $$;

-- Success message and validation
DO $$ 
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Admin Subscription Pause System Setup Complete!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tables created: admin_subscription_pauses, admin_audit_logs';
    RAISE NOTICE 'Columns added: user_subscriptions (admin pause tracking)';
    RAISE NOTICE 'Functions created: get_admin_pause_summary, cleanup_expired_admin_pauses, calculate_reactivation_delivery_date';
    RAISE NOTICE 'Triggers created: update_admin_subscription_pauses_updated_at';
    RAISE NOTICE 'Indexes created: Performance indexes for admin pause operations';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test admin pause functionality at /admin/subscriptions';
    RAISE NOTICE '2. Verify reactivation 6 PM cutoff logic';
    RAISE NOTICE '3. Test delivery scheduling with Sunday exclusion';
    RAISE NOTICE '4. Verify cron job calls cleanup_expired_admin_pauses()';
    RAISE NOTICE '================================================';
END $$;

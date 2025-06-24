-- Function to cleanup duplicate scheduled deliveries
CREATE OR REPLACE FUNCTION cleanup_duplicate_deliveries()
RETURNS void AS $$
BEGIN
    -- Delete duplicate scheduled deliveries, keeping only the most recent one
    DELETE FROM subscription_deliveries 
    WHERE id IN (
        SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY subscription_id, delivery_date 
                       ORDER BY created_at DESC
                   ) as rn
            FROM subscription_deliveries
            WHERE status = 'scheduled'
        ) t
        WHERE t.rn > 1
    );
    
    -- Log the operation
    RAISE NOTICE 'Cleanup of duplicate deliveries completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get optimal delivery schedule for a subscription
CREATE OR REPLACE FUNCTION get_delivery_schedule(
    p_subscription_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_months INTEGER DEFAULT 2
)
RETURNS TABLE (
    delivery_date TIMESTAMP WITH TIME ZONE,
    day_of_week INTEGER,
    week_of_month INTEGER,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            p_start_date::date,
            (p_start_date + (p_months || ' months')::interval)::date,
            '1 day'::interval
        )::timestamp with time zone as date_val
    ),
    subscription_info AS (
        SELECT delivery_frequency 
        FROM user_subscriptions 
        WHERE id = p_subscription_id
    )
    SELECT 
        ds.date_val as delivery_date,
        EXTRACT(DOW FROM ds.date_val)::INTEGER as day_of_week,
        EXTRACT(WEEK FROM ds.date_val)::INTEGER - 
        EXTRACT(WEEK FROM date_trunc('month', ds.date_val))::INTEGER + 1 as week_of_month,
        CASE 
            WHEN EXTRACT(DOW FROM ds.date_val) = 0 THEN FALSE  -- Sunday
            ELSE TRUE 
        END as is_valid
    FROM date_series ds
    CROSS JOIN subscription_info si
    WHERE 
        -- For monthly: every 7-8 days approximately
        (si.delivery_frequency = 'monthly' AND 
         EXTRACT(DAY FROM ds.date_val) % 8 IN (3, 4, 5)) OR
        -- For weekly: every 7 days
        (si.delivery_frequency = 'weekly' AND 
         EXTRACT(DOW FROM ds.date_val) IN (1, 2, 3, 4, 5, 6))  -- Monday to Saturday
    ORDER BY ds.date_val;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a delivery date is valid (not Sunday)
CREATE OR REPLACE FUNCTION is_valid_delivery_date(delivery_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXTRACT(DOW FROM delivery_date) != 0;  -- Not Sunday
END;
$$ LANGUAGE plpgsql;

-- Function to get next valid delivery date (skip Sundays)
CREATE OR REPLACE FUNCTION get_next_valid_delivery_date(
    base_date TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_date TIMESTAMP WITH TIME ZONE;
BEGIN
    next_date := base_date;
    
    -- If it's Sunday, move to Monday
    IF EXTRACT(DOW FROM next_date) = 0 THEN
        next_date := next_date + interval '1 day';
    END IF;
    
    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure delivery dates are never on Sunday
CREATE OR REPLACE FUNCTION validate_delivery_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically adjust Sunday deliveries to Monday
    IF EXTRACT(DOW FROM NEW.delivery_date) = 0 THEN
        NEW.delivery_date := NEW.delivery_date + interval '1 day';
        RAISE NOTICE 'Delivery date adjusted from Sunday to Monday: %', NEW.delivery_date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to subscription_deliveries table
DROP TRIGGER IF EXISTS validate_delivery_date_trigger ON subscription_deliveries;
CREATE TRIGGER validate_delivery_date_trigger
    BEFORE INSERT OR UPDATE ON subscription_deliveries
    FOR EACH ROW EXECUTE FUNCTION validate_delivery_date();

-- Create index for better performance on delivery scheduling queries
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_status_date 
ON subscription_deliveries(status, delivery_date);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_delivery 
ON user_subscriptions(status, delivery_frequency, next_delivery_date);

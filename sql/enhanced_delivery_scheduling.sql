-- Enhanced Delivery Scheduling with Time Windows
-- Extends the existing delivery scheduler with customer preferred time windows

-- Add delivery time windows table
CREATE TABLE IF NOT EXISTS delivery_time_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    delivery_fee_modifier DECIMAL(5,2) DEFAULT 0, -- Additional fee for premium time slots
    max_capacity INTEGER DEFAULT 50, -- Maximum deliveries in this window
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add customer delivery preferences table
CREATE TABLE IF NOT EXISTS customer_delivery_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    preferred_time_window_id UUID REFERENCES delivery_time_windows(id) ON DELETE SET NULL,
    alternative_time_window_id UUID REFERENCES delivery_time_windows(id) ON DELETE SET NULL,
    special_instructions TEXT,
    is_flexible BOOLEAN DEFAULT TRUE, -- Allow system to adjust time if needed
    preferred_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Preferred delivery days
    avoid_days INTEGER[] DEFAULT ARRAY[], -- Days to avoid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subscription_id)
);

-- Enhanced subscription deliveries table with time windows
ALTER TABLE subscription_deliveries 
ADD COLUMN IF NOT EXISTS delivery_time_window_id UUID REFERENCES delivery_time_windows(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS delivery_person_id UUID,
ADD COLUMN IF NOT EXISTS delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS delivery_feedback TEXT;

-- Insert default time windows
INSERT INTO delivery_time_windows (name, start_time, end_time, delivery_fee_modifier, max_capacity) VALUES
('Early Morning', '06:00:00', '08:00:00', 0, 30),
('Morning', '08:00:00', '10:00:00', 0, 50),
('Mid Morning', '10:00:00', '12:00:00', 0, 50),
('Afternoon', '12:00:00', '14:00:00', 0, 40),
('Mid Afternoon', '14:00:00', '16:00:00', 0, 45),
('Evening', '16:00:00', '18:00:00', 5, 35),
('Late Evening', '18:00:00', '20:00:00', 10, 25)
ON CONFLICT DO NOTHING;

-- Function to get available time windows for a specific date
CREATE OR REPLACE FUNCTION get_available_time_windows(
    p_delivery_date DATE,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    window_id UUID,
    window_name VARCHAR,
    start_time TIME,
    end_time TIME,
    delivery_fee DECIMAL,
    available_slots INTEGER,
    is_preferred BOOLEAN,
    is_alternative BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH delivery_counts AS (
        SELECT 
            delivery_time_window_id,
            COUNT(*) as booked_count
        FROM subscription_deliveries 
        WHERE delivery_date::date = p_delivery_date
        AND delivery_time_window_id IS NOT NULL
        AND status IN ('scheduled', 'delivered')
        GROUP BY delivery_time_window_id
    ),
    user_preferences AS (
        SELECT 
            preferred_time_window_id,
            alternative_time_window_id
        FROM customer_delivery_preferences 
        WHERE user_id = p_user_id
        LIMIT 1
    )
    SELECT 
        tw.id as window_id,
        tw.name as window_name,
        tw.start_time,
        tw.end_time,
        tw.delivery_fee_modifier as delivery_fee,
        (tw.max_capacity - COALESCE(dc.booked_count, 0)) as available_slots,
        (tw.id = up.preferred_time_window_id) as is_preferred,
        (tw.id = up.alternative_time_window_id) as is_alternative
    FROM delivery_time_windows tw
    LEFT JOIN delivery_counts dc ON tw.id = dc.delivery_time_window_id
    LEFT JOIN user_preferences up ON true
    WHERE tw.is_active = true
    AND EXTRACT(DOW FROM p_delivery_date) = ANY(tw.days_of_week)
    AND (tw.max_capacity - COALESCE(dc.booked_count, 0)) > 0
    ORDER BY is_preferred DESC, is_alternative DESC, tw.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule delivery with preferred time window
CREATE OR REPLACE FUNCTION schedule_delivery_with_time_window(
    p_subscription_id UUID,
    p_delivery_date DATE,
    p_preferred_window_id UUID DEFAULT NULL,
    p_fallback_to_available BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    delivery_id UUID,
    assigned_window_id UUID,
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_delivery_id UUID;
    v_window_id UUID;
    v_start_time TIME;
    v_end_time TIME;
    v_user_id UUID;
    v_items JSONB;
BEGIN
    -- Get subscription details
    SELECT user_id, selected_juices INTO v_user_id, v_items
    FROM user_subscriptions 
    WHERE id = p_subscription_id;

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE, 
                           NULL::TIMESTAMP WITH TIME ZONE, FALSE, 'Subscription not found';
        RETURN;
    END IF;

    -- Try to use preferred window first
    IF p_preferred_window_id IS NOT NULL THEN
        SELECT tw.id, tw.start_time, tw.end_time 
        INTO v_window_id, v_start_time, v_end_time
        FROM delivery_time_windows tw
        WHERE tw.id = p_preferred_window_id
        AND tw.is_active = true
        AND EXTRACT(DOW FROM p_delivery_date) = ANY(tw.days_of_week)
        AND (
            SELECT COUNT(*) 
            FROM subscription_deliveries 
            WHERE delivery_time_window_id = tw.id 
            AND delivery_date::date = p_delivery_date
            AND status IN ('scheduled', 'delivered')
        ) < tw.max_capacity;
    END IF;

    -- If preferred window not available and fallback is allowed
    IF v_window_id IS NULL AND p_fallback_to_available THEN
        -- Get user preferences
        SELECT preferred_time_window_id INTO v_window_id
        FROM customer_delivery_preferences 
        WHERE user_id = v_user_id;

        -- Find best available window
        SELECT tw.id, tw.start_time, tw.end_time 
        INTO v_window_id, v_start_time, v_end_time
        FROM delivery_time_windows tw
        LEFT JOIN customer_delivery_preferences cdp ON cdp.user_id = v_user_id
        WHERE tw.is_active = true
        AND EXTRACT(DOW FROM p_delivery_date) = ANY(tw.days_of_week)
        AND (
            SELECT COUNT(*) 
            FROM subscription_deliveries 
            WHERE delivery_time_window_id = tw.id 
            AND delivery_date::date = p_delivery_date
            AND status IN ('scheduled', 'delivered')
        ) < tw.max_capacity
        ORDER BY 
            CASE WHEN tw.id = cdp.preferred_time_window_id THEN 1 
                 WHEN tw.id = cdp.alternative_time_window_id THEN 2 
                 ELSE 3 END,
            tw.start_time
        LIMIT 1;
    END IF;

    IF v_window_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE, 
                           NULL::TIMESTAMP WITH TIME ZONE, FALSE, 'No available time windows';
        RETURN;
    END IF;

    -- Create the delivery record
    INSERT INTO subscription_deliveries (
        subscription_id,
        delivery_date,
        delivery_time_window_id,
        scheduled_start_time,
        scheduled_end_time,
        items,
        status
    ) VALUES (
        p_subscription_id,
        p_delivery_date::timestamp with time zone,
        v_window_id,
        (p_delivery_date::text || ' ' || v_start_time::text)::timestamp with time zone,
        (p_delivery_date::text || ' ' || v_end_time::text)::timestamp with time zone,
        v_items,
        'scheduled'
    ) RETURNING id INTO v_delivery_id;

    RETURN QUERY SELECT 
        v_delivery_id,
        v_window_id,
        (p_delivery_date::text || ' ' || v_start_time::text)::timestamp with time zone,
        (p_delivery_date::text || ' ' || v_end_time::text)::timestamp with time zone,
        TRUE,
        'Delivery scheduled successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to optimize delivery routes by time window
CREATE OR REPLACE FUNCTION optimize_delivery_routes(
    p_delivery_date DATE,
    p_time_window_id UUID DEFAULT NULL
)
RETURNS TABLE (
    route_id INTEGER,
    delivery_id UUID,
    delivery_address JSONB,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- minutes
    route_order INTEGER
) AS $$
BEGIN
    -- This is a simplified route optimization
    -- In production, you'd integrate with mapping services for actual route optimization
    RETURN QUERY
    WITH deliveries_to_route AS (
        SELECT 
            sd.id as delivery_id,
            us.delivery_address,
            sd.scheduled_start_time,
            ROW_NUMBER() OVER (ORDER BY sd.scheduled_start_time, us.delivery_address->>'zipCode') as route_order
        FROM subscription_deliveries sd
        JOIN user_subscriptions us ON sd.subscription_id = us.id
        WHERE sd.delivery_date::date = p_delivery_date
        AND sd.status = 'scheduled'
        AND (p_time_window_id IS NULL OR sd.delivery_time_window_id = p_time_window_id)
    )
    SELECT 
        1 as route_id, -- Simple single route for now
        dr.delivery_id,
        dr.delivery_address,
        dr.scheduled_start_time,
        15 as estimated_duration, -- 15 minutes per delivery
        dr.route_order::integer
    FROM deliveries_to_route dr
    ORDER BY dr.route_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update delivery preferences
CREATE OR REPLACE FUNCTION update_delivery_preferences(
    p_user_id UUID,
    p_subscription_id UUID,
    p_preferred_window_id UUID,
    p_alternative_window_id UUID DEFAULT NULL,
    p_special_instructions TEXT DEFAULT NULL,
    p_is_flexible BOOLEAN DEFAULT TRUE,
    p_preferred_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    p_avoid_days INTEGER[] DEFAULT ARRAY[]
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO customer_delivery_preferences (
        user_id,
        subscription_id,
        preferred_time_window_id,
        alternative_time_window_id,
        special_instructions,
        is_flexible,
        preferred_days,
        avoid_days
    ) VALUES (
        p_user_id,
        p_subscription_id,
        p_preferred_window_id,
        p_alternative_window_id,
        p_special_instructions,
        p_is_flexible,
        p_preferred_days,
        p_avoid_days
    )
    ON CONFLICT (subscription_id) DO UPDATE SET
        preferred_time_window_id = EXCLUDED.preferred_time_window_id,
        alternative_time_window_id = EXCLUDED.alternative_time_window_id,
        special_instructions = EXCLUDED.special_instructions,
        is_flexible = EXCLUDED.is_flexible,
        preferred_days = EXCLUDED.preferred_days,
        avoid_days = EXCLUDED.avoid_days,
        updated_at = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_time_windows_active ON delivery_time_windows(is_active, start_time);
CREATE INDEX IF NOT EXISTS idx_customer_delivery_preferences_user ON customer_delivery_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_window_date ON subscription_deliveries(delivery_time_window_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_scheduled_time ON subscription_deliveries(scheduled_start_time);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_delivery_time_windows_updated_at 
    BEFORE UPDATE ON delivery_time_windows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_delivery_preferences_updated_at 
    BEFORE UPDATE ON customer_delivery_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE delivery_time_windows IS 'Available delivery time windows with capacity management';
COMMENT ON TABLE customer_delivery_preferences IS 'Customer preferences for delivery scheduling';
COMMENT ON COLUMN subscription_deliveries.delivery_time_window_id IS 'Assigned delivery time window';
COMMENT ON COLUMN subscription_deliveries.scheduled_start_time IS 'Scheduled delivery start time';
COMMENT ON COLUMN subscription_deliveries.scheduled_end_time IS 'Scheduled delivery end time';
COMMENT ON FUNCTION get_available_time_windows IS 'Returns available time windows for a specific date with user preferences';
COMMENT ON FUNCTION schedule_delivery_with_time_window IS 'Schedules delivery with preferred time window and fallback logic';
COMMENT ON FUNCTION optimize_delivery_routes IS 'Optimizes delivery routes by time window and location';

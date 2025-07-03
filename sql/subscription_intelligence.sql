-- Advanced Subscription Intelligence Schema
-- Machine Learning and WhatsApp Integration Tables

-- Customer behavior tracking for ML models
CREATE TABLE IF NOT EXISTS customer_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    
    -- Engagement metrics
    last_login TIMESTAMP WITH TIME ZONE,
    login_frequency INTEGER DEFAULT 0, -- logins per week
    app_session_duration INTEGER DEFAULT 0, -- average minutes per session
    
    -- Subscription interaction
    customization_changes INTEGER DEFAULT 0, -- juice changes per month
    pause_frequency INTEGER DEFAULT 0, -- pauses per year
    delivery_ratings_avg DECIMAL(3,2) DEFAULT 5.0,
    complaints_count INTEGER DEFAULT 0,
    
    -- Payment behavior
    payment_failures INTEGER DEFAULT 0,
    payment_method_changes INTEGER DEFAULT 0,
    late_payments INTEGER DEFAULT 0,
    
    -- Communication preferences
    whatsapp_opted_in BOOLEAN DEFAULT FALSE,
    email_engagement_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    sms_response_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Predictive scores (updated by ML models)
    churn_risk_score DECIMAL(5,2) DEFAULT 0, -- 0-100%
    lifetime_value_prediction DECIMAL(10,2) DEFAULT 0,
    next_pause_prediction_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ML model predictions and actions
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL, -- 'churn_prediction', 'demand_forecast', 'pause_prediction', 'pricing_optimization'
    
    -- Prediction data
    prediction_value JSONB NOT NULL, -- flexible structure for different model outputs
    confidence_score DECIMAL(5,2) NOT NULL, -- 0-100%
    
    -- Metadata
    model_version VARCHAR(20) NOT NULL,
    features_used JSONB, -- input features for transparency
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Action taken
    action_triggered BOOLEAN DEFAULT FALSE,
    action_type VARCHAR(50), -- 'retention_offer', 'pause_reminder', 'price_adjustment'
    action_result VARCHAR(20), -- 'pending', 'successful', 'failed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp conversations and message tracking
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_phone_number VARCHAR(20) NOT NULL,
    
    -- Conversation metadata
    conversation_id VARCHAR(100) UNIQUE NOT NULL, -- WhatsApp conversation ID
    conversation_type VARCHAR(30) NOT NULL, -- 'marketing', 'utility', 'authentication', 'service'
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'ended', 'expired'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Business context
    trigger_event VARCHAR(50), -- 'churn_risk', 'pause_reminder', 'delivery_feedback', 'manual'
    related_subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    
    -- Pricing (for cost tracking)
    message_count INTEGER DEFAULT 0,
    estimated_cost DECIMAL(8,4) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual WhatsApp messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    
    -- Message details
    whatsapp_message_id VARCHAR(100) UNIQUE NOT NULL,
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    message_type VARCHAR(20) NOT NULL, -- 'text', 'template', 'interactive', 'media'
    
    -- Content
    content JSONB NOT NULL, -- message content structure
    template_name VARCHAR(100), -- if template message
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Cost tracking
    message_cost DECIMAL(6,4) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp automation rules and templates
CREATE TABLE IF NOT EXISTS whatsapp_automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Rule configuration
    rule_name VARCHAR(100) NOT NULL,
    trigger_event VARCHAR(50) NOT NULL, -- 'high_churn_risk', 'pause_reminder', 'delivery_rating_low'
    conditions JSONB NOT NULL, -- conditions to trigger the rule
    
    -- Template and content
    template_name VARCHAR(100) NOT NULL,
    message_content JSONB NOT NULL,
    
    -- Timing and frequency
    delay_minutes INTEGER DEFAULT 0, -- delay before sending
    max_frequency_days INTEGER DEFAULT 7, -- don't send more than once per X days
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    success_rate DECIMAL(5,2) DEFAULT 0, -- percentage of successful sends
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasonal demand forecasting data
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    forecast_date DATE NOT NULL,
    forecast_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Product/service forecasts
    subscription_plan_id VARCHAR(50),
    juice_id VARCHAR(50),
    region VARCHAR(50),
    
    -- Forecast values
    predicted_demand INTEGER NOT NULL,
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,
    
    -- External factors
    weather_factor DECIMAL(4,2) DEFAULT 1.0,
    holiday_factor DECIMAL(4,2) DEFAULT 1.0,
    seasonal_factor DECIMAL(4,2) DEFAULT 1.0,
    
    -- Model metadata
    model_version VARCHAR(20) NOT NULL,
    accuracy_score DECIMAL(5,2), -- for historical forecasts
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dynamic pricing rules and history
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pricing rule
    rule_name VARCHAR(100) NOT NULL,
    subscription_plan_id VARCHAR(50) NOT NULL,
    
    -- Conditions
    demand_threshold_low INTEGER DEFAULT 50, -- below this: discount
    demand_threshold_high INTEGER DEFAULT 200, -- above this: premium
    seasonal_multipliers JSONB, -- month-based multipliers
    
    -- Pricing adjustments
    discount_percentage DECIMAL(5,2) DEFAULT 0, -- for low demand
    premium_percentage DECIMAL(5,2) DEFAULT 0, -- for high demand
    max_discount DECIMAL(5,2) DEFAULT 20, -- maximum discount allowed
    max_premium DECIMAL(5,2) DEFAULT 25, -- maximum premium allowed
    
    -- Geographic factors
    regions JSONB, -- region-specific pricing
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing history for analytics
CREATE TABLE IF NOT EXISTS pricing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id VARCHAR(50) NOT NULL,
    
    -- Pricing data
    base_price DECIMAL(8,2) NOT NULL,
    adjusted_price DECIMAL(8,2) NOT NULL,
    adjustment_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Adjustment reason
    adjustment_reason VARCHAR(50), -- 'high_demand', 'low_demand', 'seasonal', 'regional'
    demand_level INTEGER,
    
    -- Geographic and temporal context
    region VARCHAR(50),
    effective_date DATE NOT NULL,
    
    -- Performance tracking
    conversion_rate_before DECIMAL(5,2),
    conversion_rate_after DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_behavior_user_id ON customer_behavior_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_churn_score ON customer_behavior_analytics(churn_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_user_model ON ml_predictions(user_id, model_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_date ON ml_predictions(prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(whatsapp_phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON demand_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_pricing_history_plan_date ON pricing_history(subscription_plan_id, effective_date);

-- Functions for ML model updates
CREATE OR REPLACE FUNCTION update_customer_behavior_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update behavior analytics when user actions occur
    INSERT INTO customer_behavior_analytics (user_id, subscription_id, updated_at)
    VALUES (NEW.user_id, NEW.id, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        updated_at = NOW(),
        -- Add specific metric updates based on the trigger
        customization_changes = customer_behavior_analytics.customization_changes + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic behavior tracking
CREATE TRIGGER trigger_update_behavior_metrics
    AFTER INSERT OR UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_behavior_metrics();

-- Function to calculate churn risk score (simplified version)
CREATE OR REPLACE FUNCTION calculate_churn_risk_score(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    risk_score DECIMAL(5,2) := 0;
    behavior_data RECORD;
BEGIN
    SELECT * INTO behavior_data 
    FROM customer_behavior_analytics 
    WHERE user_id = p_user_id;
    
    IF FOUND THEN
        -- Simple scoring algorithm (replace with actual ML model)
        IF behavior_data.login_frequency < 2 THEN risk_score := risk_score + 20; END IF;
        IF behavior_data.delivery_ratings_avg < 3.5 THEN risk_score := risk_score + 25; END IF;
        IF behavior_data.payment_failures > 2 THEN risk_score := risk_score + 30; END IF;
        IF behavior_data.complaints_count > 3 THEN risk_score := risk_score + 15; END IF;
        IF behavior_data.pause_frequency > 6 THEN risk_score := risk_score + 10; END IF;
    END IF;
    
    RETURN LEAST(risk_score, 100); -- Cap at 100%
END;
$$ LANGUAGE plpgsql;

-- Add order type and subscription info columns to orders table
ALTER TABLE orders 
ADD COLUMN order_type VARCHAR(20) DEFAULT 'one_time' CHECK (order_type IN ('one_time', 'subscription')),
ADD COLUMN subscription_info JSONB;

-- Create index for efficient queries on order type
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_subscription ON orders(order_type) WHERE order_type = 'subscription';

-- Update existing orders to have default order type
UPDATE orders 
SET order_type = 'one_time'
WHERE order_type IS NULL;

COMMENT ON COLUMN orders.order_type IS 'Type of order: one_time for regular orders, subscription for subscription orders';
COMMENT ON COLUMN orders.subscription_info IS 'JSON data containing subscription details for subscription orders';

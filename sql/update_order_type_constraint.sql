-- Update order_type constraint to include 'mixed' type for orders containing both regular and subscription items
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_order_type_check;

-- Add new constraint that includes 'mixed' order type
ALTER TABLE orders 
ADD CONSTRAINT orders_order_type_check 
CHECK (order_type IN ('one_time', 'subscription', 'mixed'));

-- Update comment to reflect new order types
COMMENT ON COLUMN orders.order_type IS 'Type of order: one_time for regular items only, subscription for subscription items only, mixed for both types together';

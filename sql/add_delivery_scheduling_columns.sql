-- Add delivery scheduling columns to orders table
-- This enables the new 6 PM cutoff delivery scheduling system

-- Add first delivery date column (when the subscription starts delivering)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS first_delivery_date TIMESTAMP WITH TIME ZONE;

-- Add flag to track if order was placed after 6 PM cutoff
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_after_cutoff BOOLEAN;

-- Add complete delivery schedule for subscription orders (JSONB for flexibility)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_schedule JSONB;

-- Add indexes for efficient querying on delivery dates
CREATE INDEX IF NOT EXISTS idx_orders_first_delivery_date ON orders(first_delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_schedule ON orders USING GIN(delivery_schedule);

-- Add comments for documentation
COMMENT ON COLUMN orders.first_delivery_date IS 'The first delivery date calculated based on 6 PM cutoff rule';
COMMENT ON COLUMN orders.is_after_cutoff IS 'True if order was placed after 6 PM, affecting delivery date calculation';
COMMENT ON COLUMN orders.delivery_schedule IS 'Complete delivery schedule for subscription orders including all delivery dates';

-- Example of delivery_schedule JSONB structure:
-- {
--   "startDate": "2025-06-30T00:00:00.000Z",
--   "endDate": "2025-08-30T00:00:00.000Z", 
--   "deliveryDates": ["2025-06-30T00:00:00.000Z", "2025-07-07T00:00:00.000Z", ...],
--   "totalDeliveries": 8
-- }

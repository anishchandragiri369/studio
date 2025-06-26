-- Add email column to orders table
-- Run this in your Supabase SQL editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add an index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN orders.email IS 'Customer email address for order notifications';

-- Add cashfree_order_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cashfree_order_id VARCHAR(255);

-- Add payment_session_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_cashfree_order_id ON orders(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_session_id ON orders(payment_session_id);

-- Add comments to document the columns
COMMENT ON COLUMN orders.cashfree_order_id IS 'Cashfree payment gateway order ID';
COMMENT ON COLUMN orders.payment_session_id IS 'Cashfree payment session ID for checkout';

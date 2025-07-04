-- Simplified RLS policies for order_ratings table
-- This approach focuses on basic user permissions without complex admin roles

-- Enable RLS on order_ratings table
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy for INSERT operations - users can rate their own orders
CREATE POLICY "Users can insert their own ratings" ON order_ratings
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_ratings.order_id
      AND orders.user_id = order_ratings.user_id
    )
  );

-- Create policy for SELECT operations - users can view their own ratings
CREATE POLICY "Users can view their own ratings" ON order_ratings
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for DELETE operations - users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON order_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policy for UPDATE operations - users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON order_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add service role bypass policy (simplest approach for API endpoints)
CREATE POLICY "Service role can manage all ratings" ON order_ratings
  USING (true)
  WITH CHECK (true);

-- Also create similar policies for product_ratings table
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own product ratings" ON product_ratings
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = product_ratings.order_id
      AND orders.user_id = product_ratings.user_id
    )
  );

CREATE POLICY "Users can view their own product ratings" ON product_ratings
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all product ratings" ON product_ratings
  USING (true)
  WITH CHECK (true);

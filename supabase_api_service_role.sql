-- This function creates a service role policy that bypasses RLS for the server API
-- Use this if you're using the service_role key in your API routes

-- For order_ratings table
CREATE POLICY "Service role can manage all ratings" ON order_ratings
  USING (true)
  WITH CHECK (true);

-- Alternatively, you can use a special auth user for the API
-- This method is safer as it doesn't bypass all RLS

-- Create a system user for the API
INSERT INTO auth.users (id, email, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'api@system.local', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create policies that allow this system user to perform actions
CREATE POLICY "API user can insert ratings" ON order_ratings
  FOR INSERT 
  WITH CHECK (
    auth.uid() = '00000000-0000-0000-0000-000000000000' OR
    (auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_ratings.order_id
      AND orders.user_id = order_ratings.user_id
    ))
  );

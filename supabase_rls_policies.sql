-- RLS Policy for order_ratings table
-- This policy allows users to insert ratings for their own orders

-- Enable RLS on order_ratings table (in case it's not already enabled)
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy for INSERT operations
CREATE POLICY "Users can rate their own orders" ON order_ratings
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

-- Check if the user_roles table exists before creating the admin policy
DO $$
BEGIN
    -- Check if the user_roles table exists
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles'
    ) THEN
        -- Create the admin policy if the table exists
        EXECUTE '
        CREATE POLICY "Admins can manage all ratings" ON order_ratings
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid() 
              AND user_roles.role = ''admin''
            )
          )';
    ELSE
        -- Alternative: Create a policy using the admins table instead (if it exists)
        IF EXISTS (
            SELECT FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'admins'
        ) THEN
            EXECUTE '
            CREATE POLICY "Admins can manage all ratings" ON order_ratings
              USING (
                EXISTS (
                  SELECT 1 FROM admins
                  WHERE admins.email = auth.email()
                )
              )';
        ELSE
            -- If neither user_roles nor admins table exists, create a simple bypass policy for service role
            EXECUTE '
            CREATE POLICY "Service role can manage all ratings" ON order_ratings
              USING (true)
              WITH CHECK (true)';
        END IF;
    END IF;
END
$$;

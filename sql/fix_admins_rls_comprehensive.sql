-- Comprehensive fix for admins table RLS policies
-- This script will drop existing policies and create new ones with proper conditions

-- First, let's check if the table exists and has the right structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins') THEN
        RAISE EXCEPTION 'admins table does not exist. Please run create_admins_table.sql first.';
    END IF;
END
$$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view admins" ON admins;
DROP POLICY IF EXISTS "Allow authenticated users to insert admins" ON admins;
DROP POLICY IF EXISTS "Allow authenticated users to update admins" ON admins;
DROP POLICY IF EXISTS "Allow authenticated users to delete admins" ON admins;
DROP POLICY IF EXISTS "Allow admin access" ON admins;
DROP POLICY IF EXISTS "Allow service role access" ON admins;

-- Enable RLS on the admins table (if not already enabled)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role (backend) to do everything
CREATE POLICY "Service role full access"
ON admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow anon role to read admins (for client-side admin checks)
-- This is needed for the frontend to verify admin status
CREATE POLICY "Allow anon read access"
ON admins
FOR SELECT
TO anon
USING (true);

-- Policy 3: Allow authenticated users to read admins
CREATE POLICY "Allow authenticated read access"
ON admins
FOR SELECT
TO authenticated
USING (true);

-- Policy 4: Separate policies for different operations to avoid recursion

-- Allow INSERT only by existing admins (but avoid recursive checks)
CREATE POLICY "Allow admin insert"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE email = auth.email()
    )
);

-- Allow UPDATE only by existing admins
CREATE POLICY "Allow admin update"
ON admins
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE email = auth.email()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE email = auth.email()
    )
);

-- Allow DELETE only by existing admins
CREATE POLICY "Allow admin delete"
ON admins
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE email = auth.email()
    )
);

-- Grant necessary permissions
GRANT SELECT ON admins TO anon;
GRANT SELECT ON admins TO authenticated;
GRANT ALL ON admins TO service_role;

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'admins';

-- Show current table permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'admins';

COMMIT;

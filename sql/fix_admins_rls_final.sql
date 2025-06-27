-- FINAL FIX for admins table RLS policies
-- This script completely removes all existing problematic policies and creates the correct ones

BEGIN;

-- Drop ALL existing policies on the admins table to start fresh
DROP POLICY IF EXISTS "Only admins can manage admins table" ON public.admins;
DROP POLICY IF EXISTS "Users can read admins table for admin checks" ON public.admins;
DROP POLICY IF EXISTS "Only admins can insert admins" ON public.admins;
DROP POLICY IF EXISTS "Only admins can update admins" ON public.admins;
DROP POLICY IF EXISTS "Only admins can delete admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated users to view admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated users to insert admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated users to update admins" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated users to delete admins" ON public.admins;
DROP POLICY IF EXISTS "Allow admin access" ON public.admins;
DROP POLICY IF EXISTS "Allow service role access" ON public.admins;
DROP POLICY IF EXISTS "Service role full access" ON public.admins;
DROP POLICY IF EXISTS "Allow anon read access" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.admins;
DROP POLICY IF EXISTS "Allow admin insert" ON public.admins;
DROP POLICY IF EXISTS "Allow admin update" ON public.admins;
DROP POLICY IF EXISTS "Allow admin delete" ON public.admins;

-- Ensure RLS is enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role (backend API) to do everything
CREATE POLICY "Service role full access"
ON public.admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow ALL users (anon and authenticated) to READ the admins table
-- This is crucial for client-side admin checks and prevents 500 errors
CREATE POLICY "Public read access for admin checks"
ON public.admins
FOR SELECT
TO public
USING (true);

-- Policy 3: Only allow authenticated users who are already admins to INSERT new admins
-- Using a safe non-recursive check
CREATE POLICY "Admin only insert"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.email()
    )
);

-- Policy 4: Only allow authenticated users who are already admins to UPDATE admins
CREATE POLICY "Admin only update"
ON public.admins
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.email()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.email()
    )
);

-- Policy 5: Only allow authenticated users who are already admins to DELETE admins
CREATE POLICY "Admin only delete"
ON public.admins
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins 
        WHERE email = auth.email()
    )
);

-- Grant necessary permissions
GRANT SELECT ON public.admins TO anon;
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;

-- Verify policies are set correctly
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
WHERE tablename = 'admins'
ORDER BY policyname;

-- Test that basic operations work
-- This should NOT fail for any user (admin or non-admin)
SELECT COUNT(*) as admin_count FROM public.admins;

COMMIT;

-- Instructions for use:
-- 1. Run this script in your Supabase SQL editor
-- 2. Test admin check functionality with both admin and non-admin users
-- 3. Verify that non-admin users can read the table without 500 errors
-- 4. Verify that only admin users can insert/update/delete records

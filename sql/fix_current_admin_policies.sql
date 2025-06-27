-- STEP-BY-STEP FIX for Current Admin Policies
-- This will replace your current policies with the correct ones

BEGIN;

-- Step 1: Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Authenticated users can read admins table" ON public.admins;
DROP POLICY IF EXISTS "Only admin users can delete from admins table" ON public.admins;
DROP POLICY IF EXISTS "Only admin users can insert into admins table" ON public.admins;
DROP POLICY IF EXISTS "Only admin users can update admins table" ON public.admins;
DROP POLICY IF EXISTS "Users can read admins table for admin checks" ON public.admins;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the correct policies

-- Policy 1: Allow EVERYONE (anon + authenticated) to read the admins table
-- This is crucial because the app needs to check admin status before authentication completes
CREATE POLICY "Public read access for admin checks"
ON public.admins
FOR SELECT
TO public  -- This means both 'anon' and 'authenticated' roles
USING (true);

-- Policy 2: Allow service role full access (for backend API operations)
CREATE POLICY "Service role full access"
ON public.admins
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Only authenticated admin users can INSERT new admins
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

-- Policy 4: Only authenticated admin users can UPDATE admins
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

-- Policy 5: Only authenticated admin users can DELETE admins
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

-- Step 4: Grant necessary permissions
GRANT SELECT ON public.admins TO anon;
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;

-- Step 5: Verify the new policies
SELECT 
    policyname,
    cmd,
    roles,
    permissive
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY cmd, policyname;

-- Step 6: Test that basic read access works (should not fail for anyone)
SELECT COUNT(*) as total_admins FROM public.admins;

COMMIT;

-- Expected output after running this script:
-- You should see 5 policies:
-- 1. "Public read access for admin checks" (SELECT, public)
-- 2. "Service role full access" (ALL, service_role) 
-- 3. "Admin only insert" (INSERT, authenticated)
-- 4. "Admin only update" (UPDATE, authenticated)
-- 5. "Admin only delete" (DELETE, authenticated)

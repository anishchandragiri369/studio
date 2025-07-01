-- Fix admin table RLS policies to resolve circular dependency issue
-- The problem: The "Only admins can manage admins table" policy was applying to ALL operations,
-- including SELECT, which prevented non-admin users from checking if they are admins.

-- First, drop the problematic policy that blocks SELECT operations
DROP POLICY IF EXISTS "Only admins can manage admins table" ON public.admins;

-- Make sure the SELECT policy exists (it should allow all authenticated users to read)
DROP POLICY IF EXISTS "Users can read admins table for admin checks" ON public.admins;
CREATE POLICY "Users can read admins table for admin checks" ON public.admins
  FOR SELECT TO authenticated
  USING (true);

-- Create separate policies for INSERT, UPDATE, DELETE (not SELECT)
CREATE POLICY "Only admins can insert admins" ON public.admins
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Only admins can update admins" ON public.admins
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Only admins can delete admins" ON public.admins
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Verify the policies are correct
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admins';

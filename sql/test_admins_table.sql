-- Test script to verify admin table and policies are working correctly

-- 1. Check if admins table exists and has data
SELECT 'Table exists and has records:' as test, count(*) as admin_count FROM public.admins;

-- 2. Check current policies on admins table
SELECT 'Current policies:' as test, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admins';

-- 3. Test if we can read admin data (this should work for any authenticated user)
SELECT 'Can read admin emails:' as test, email FROM public.admins LIMIT 3;

-- 4. Check if your specific email is in the admins table
SELECT 'Your admin status:' as test, 
       CASE WHEN EXISTS(SELECT 1 FROM public.admins WHERE email = 'anishchandragiri@gmail.com') 
            THEN 'You are an admin' 
            ELSE 'You are NOT an admin' 
       END as status;

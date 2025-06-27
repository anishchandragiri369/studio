## 🚨 URGENT: Fix Supabase Admin Authentication 500 Errors

### **Problem**: 
- Non-admin users get 500 errors when the app checks if they're admin
- RLS policies on `admins` table are blocking SELECT operations for non-admins
- This creates infinite recursion: can't read table to check if admin, because not admin

### **Solution**: Apply Final RLS Policy Fix

**Step 1: Open Supabase SQL Editor**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query

**Step 2: Run the Final Fix Script**
Copy and paste the contents of `sql/fix_admins_rls_final.sql` and execute it.

**Step 3: Test the Fix**
After running the script:

1. **Test with Admin User**:
   - Log in with an admin email (anishchandragiri@gmail.com, etc.)
   - Should have access to admin features
   - No 500 errors

2. **Test with Non-Admin User**:
   - Log in with a non-admin email
   - Should NOT have admin access but NO 500 errors
   - App should work normally for regular features

**Step 4: Verify Policy Status**
Run this query in Supabase SQL Editor to verify policies:

```sql
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'admins'
ORDER BY policyname;
```

**Expected Policies After Fix**:
- `Service role full access` - Allows backend API full access
- `Public read access for admin checks` - Allows all users to read for admin checks
- `Admin only insert/update/delete` - Only admins can modify records

### **Key Changes Made**:
1. ✅ **Public Read Access**: All users can now read the admins table for admin checks
2. ✅ **Non-Recursive Policies**: Uses safe `EXISTS` queries that don't cause infinite loops
3. ✅ **Separate Operations**: Different policies for read vs write operations
4. ✅ **Service Role Access**: Backend APIs can still perform all operations

### **Files Involved**:
- `sql/fix_admins_rls_final.sql` - The final fix script
- `src/context/AuthContext.tsx` - Client-side admin checks
- `sql/create_admins_table.sql` - Original problematic policies (superseded)

### **Technical Details**:
The original policy was:
```sql
-- PROBLEMATIC (blocks non-admins from reading)
CREATE POLICY "Only admins can manage admins table" ON public.admins
  FOR ALL TO authenticated  -- This blocked SELECT for non-admins!
```

The fix creates separate policies:
```sql
-- FIXED (allows everyone to read)
CREATE POLICY "Public read access for admin checks" ON public.admins
  FOR SELECT TO public  -- Anyone can read
  USING (true);

-- FIXED (only admins can modify)
CREATE POLICY "Admin only insert" ON public.admins
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email()));
```

### **After Fix**:
- ✅ Non-admin users: Can read admins table, no 500 errors, no admin access
- ✅ Admin users: Can read admins table, no 500 errors, full admin access  
- ✅ Backend APIs: Full access via service role
- ✅ Security: Only admins can insert/update/delete admin records

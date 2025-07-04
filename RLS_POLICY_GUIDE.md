# RLS Policy Implementation Guide

This guide explains how to implement Row Level Security (RLS) policies for your Supabase tables, specifically focusing on the order ratings functionality.

## The Issue

You encountered an error when trying to submit ratings with RLS enabled:
```
Failed to submit rating: new row violates row-level security policy for table "order_ratings"
```

This happens because the default RLS behavior is to deny all operations unless explicitly allowed by a policy.

## Solution Options

### Option 1: Simplified Approach (Recommended for Most Cases)

Use the `simplified_rls_policies.sql` file if you want a straightforward implementation:

1. Log into your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `simplified_rls_policies.sql`
4. Run the SQL statements

This approach:
- Enables RLS on the relevant tables
- Creates policies for user operations
- Creates a bypass policy for service role access

### Option 2: Advanced Approach with Admin Roles

If you have a more complex permission system with admin roles:

1. Ensure your admin tables exist (either `user_roles` or `admins`)
2. Run the `supabase_rls_policies.sql` file through the Supabase SQL Editor

### Option 3: Manual Policy Creation

To manually create the policies in the Supabase dashboard:

1. Go to the Authentication > Policies section
2. Select the `order_ratings` table
3. Enable RLS if not already enabled
4. Add these policies:
   - Users can insert ratings for their own orders
   - Users can view their own ratings
   - Service role can manage all ratings

## Important: Service Role Key

For your API routes to work with RLS, make sure:

1. The `SUPABASE_SERVICE_ROLE_KEY` is set in your environment variables
2. The API routes use the service role client for database operations

Example code for your API routes:
```typescript
// Create admin client with service role
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use adminClient instead of regular supabase client
const { data, error } = await adminClient.from('order_ratings').insert(...);
```

## Testing Your Implementation

After implementing RLS policies, test by:
1. Logging in as a regular user and submitting a rating
2. Verifying the rating is stored correctly
3. Confirming that users can only see their own ratings

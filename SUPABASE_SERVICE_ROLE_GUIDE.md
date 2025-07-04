# Service Role Authentication for Supabase

This guide explains how to properly set up service role authentication for your API routes.

## Required Environment Variables

Make sure to add these to your .env file:

```
# Public variables for client-side
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Private variables for server-side only
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## RLS Policy Setup

For the order_ratings table, apply these RLS policies:

1. Enable Row Level Security on the table
```sql
ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;
```

2. Create a policy for users to insert ratings for their own orders
```sql
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
```

3. Create a policy for users to view their own ratings
```sql
CREATE POLICY "Users can view their own ratings" ON order_ratings
  FOR SELECT 
  USING (auth.uid() = user_id);
```

## Implementation Guide

In your API routes, use the service role client for database operations that require bypassing RLS:

```typescript
import { createClient } from '@supabase/supabase-js';

// Regular client for client-side operations (respects RLS)
import { supabase } from '@/lib/supabaseClient';

// Admin client for server-side operations (bypasses RLS)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Use adminClient for operations that need to bypass RLS
const { data, error } = await adminClient.from('table').insert(...);
```

IMPORTANT: Never expose the service role key to the client-side code!

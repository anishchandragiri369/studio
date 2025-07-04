# Troubleshooting Guide: Orders & Subscriptions Loading Issues

If you're experiencing indefinite loading on the orders or subscriptions page, try these troubleshooting steps:

## Common Issues and Solutions

### 1. Check Authentication State

If the page keeps spinning but works after a refresh, the issue might be with the auth state not being properly synchronized:

```javascript
// In your browser console, check the current auth state
const checkAuth = async () => {
  const { data } = await window.supabase.auth.getSession();
  console.log("Current auth session:", data);
}
checkAuth();
```

### 2. Enable Debug Logging

Add this snippet at the beginning of your page component:

```javascript
useEffect(() => {
  console.log("[DEBUG] Component mounted with auth state:", {
    user: user?.id || "not logged in",
    loading: authLoading,
    supabaseConfigured: isSupabaseConfigured
  });
  
  return () => {
    console.log("[DEBUG] Component unmounting");
  };
}, []);
```

### 3. Check Supabase Connection

Test if Supabase is properly connected:

```javascript
// In your browser console
const testSupabase = async () => {
  try {
    const { data, error } = await window.supabase
      .from('orders')
      .select('count')
      .limit(1);
      
    console.log("Supabase test:", { data, error });
  } catch (e) {
    console.error("Supabase connection error:", e);
  }
}
testSupabase();
```

### 4. Force Refresh the Page

Sometimes the fastest solution is to completely reload the page:

```javascript
// In your code, add a timeout to force refresh if loading takes too long
useEffect(() => {
  let timeoutId;
  
  if (loading) {
    timeoutId = setTimeout(() => {
      console.log("Loading timeout reached, refreshing page");
      window.location.reload();
    }, 10000); // 10 second timeout
  }
  
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
}, [loading]);
```

## Database RLS Issues

If you're using RLS (Row Level Security) in Supabase, check:

1. The RLS policies are properly configured
2. The user has appropriate permissions
3. API routes are using the service role when needed

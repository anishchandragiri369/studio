# Google OAuth Configuration Guide

## Issue
When users click "Continue with Google", they see "Choose an account to continue to rvdrtpyssyqardgxtdie.supabase.co" instead of your custom domain.

## Solution

### 1. Update Supabase OAuth Configuration

Go to your Supabase Dashboard:
1. Navigate to: https://supabase.com/dashboard/project/rvdrtpyssyqardgxtdie
2. Go to **Authentication** → **Settings** → **URL Configuration**
3. Update the following URLs:

#### Site URL
- Update to your domain: `https://yourdomain.com` (or `http://localhost:9002` for development)

#### Redirect URLs
Add these URLs to your allowed redirect URLs:
- `https://yourdomain.com/` (primary redirect)
- `http://localhost:9002/` (for development)
- `https://yourdomain.com/auth/callback` (fallback)
- `http://localhost:9002/auth/callback` (fallback for development)

### 2. Update Google OAuth Settings

In your Google Cloud Console:
1. Go to: https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Update **Authorized redirect URIs**:
   - Remove: `https://rvdrtpyssyqardgxtdie.supabase.co/auth/v1/callback`
   - Add: `https://yourdomain.com/` (primary)
   - Add: `http://localhost:9002/` (for development)

### 3. Environment Variables (if needed)

Check your `.env.local` file and ensure you have:
```env
NEXT_PUBLIC_SUPABASE_URL=https://rvdrtpyssyqardgxtdie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4. Test the Implementation

1. Deploy your changes
2. Test Google Sign-In
3. Users should now see "Choose an account to continue to yourdomain.com"

## What We've Implemented

1. **Updated AuthContext**: Modified `signInWithGoogle` to redirect to `/auth/callback`
2. **Created Auth Callback Page**: Handles the OAuth redirect and exchanges the code for a session
3. **Improved User Experience**: Shows loading states and error handling

## Notes

- The auth callback page (`/auth/callback`) handles the OAuth flow completion
- Users will be redirected to the home page after successful authentication
- Error handling is included for failed authentication attempts
- The implementation follows Supabase best practices for OAuth flows

## Testing Locally

For local testing, use:
- Redirect URL: `http://localhost:9002/auth/callback`
- Site URL: `http://localhost:9002`

Make sure to restart your development server after any environment variable changes.

## Troubleshooting "No authorization code received" Error

### Immediate Fix for Local Development

1. **Update Google Cloud Console Settings RIGHT NOW**:
   - Go to: https://console.cloud.google.com/
   - Navigate to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - In **Authorized redirect URIs**, ADD:
     - `http://localhost:9002/auth/callback`
   - Click **Save**

2. **Update Supabase Settings**:
   - Go to: https://supabase.com/dashboard/project/rvdrtpyssyqardgxtdie
   - Go to **Authentication** → **Settings** → **URL Configuration**
   - Set **Site URL** to: `http://localhost:9002`
   - In **Redirect URLs**, ADD:
     - `http://localhost:9002/auth/callback`
     - `http://localhost:9002/`
   - Click **Save**

3. **Restart Your Development Server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### Common Causes of This Error

1. **Missing Redirect URL**: The most common cause is that `http://localhost:9002/auth/callback` is not added to Google OAuth settings
2. **Mismatched URLs**: Google redirect URI must exactly match what's configured
3. **Supabase Site URL**: Must be set to your development URL
4. **Cache Issues**: Browser cache or old OAuth tokens

### Step-by-Step Verification

1. **Check Google Cloud Console**:
   - Ensure `http://localhost:9002/auth/callback` is in Authorized redirect URIs
   - Make sure the OAuth client is enabled

2. **Check Supabase Dashboard**:
   - Verify Google provider is enabled in Authentication → Providers
   - Confirm Site URL is set to `http://localhost:9002`
   - Confirm redirect URLs include `http://localhost:9002/auth/callback`

3. **Clear Browser Data**:
   - Clear cookies and localStorage for localhost:9002
   - Try in incognito/private mode

4. **Check Console Logs**:
   - Open browser DevTools → Console
   - Look for any error messages during OAuth flow

### Alternative Quick Fix

If the above doesn't work immediately, try this temporary fix:

1. In Google Cloud Console, also add:
   - `http://localhost:9002/`
   - `https://rvdrtpyssyqardgxtdie.supabase.co/auth/v1/callback` (temporarily)

2. Test the flow and see which URL actually receives the callback

### Production Setup

For production, replace `localhost:9002` with your actual domain:
- `https://yourdomain.com/auth/callback`
- `https://yourdomain.com/`

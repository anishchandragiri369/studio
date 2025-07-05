# Google OAuth Sign-In vs Sign-Up Flow Test

## 🎯 Summary

Fixed the critical issue where users could bypass the intended OAuth flow. 

## ❌ **Previous Problem:**
- Users clicking "Sign in with Google" on login page would automatically get created in our database if they didn't exist
- This bypassed our intended flow where users must sign up first

## ✅ **Solution Implemented:**

### 1. **Separate OAuth Functions**
- `signInWithGoogle()` - Sets `oauth-signin-attempt = 'true'`
- `signUpWithGoogle()` - Sets `oauth-signin-attempt = 'false'`

### 2. **Updated GoogleSignInButton**
- Added `isSignUp` prop to distinguish between sign-in and sign-up flows
- Uses appropriate OAuth function based on the prop

### 3. **Updated Pages**
- **Login page**: Uses `<GoogleSignInButton isSignUp={false} />` (default)
- **Signup page**: Uses `<GoogleSignInButton isSignUp={true} />`

### 4. **AuthContext Logic**
- Checks `oauth-signin-attempt` flag to determine user intent
- **If `'true'` (sign-in attempt)**: Verifies user exists in DB, redirects to signup if not
- **If `'false'` (sign-up attempt)**: Proceeds with user creation and setup

## 🔒 **Security Flow Now:**

### Sign-In with Google (from login page):
1. User clicks "Sign in with Google" 
2. Sets `oauth-signin-attempt = 'true'`
3. OAuth completes → AuthContext checks if user exists in our DB
4. **If user exists**: Allow sign-in ✅
5. **If user doesn't exist**: Sign out + redirect to signup ❌

### Sign-Up with Google (from signup page):
1. User clicks "Sign up with Google"
2. Sets `oauth-signin-attempt = 'false'` 
3. OAuth completes → AuthContext recognizes this as signup
4. Creates user in our database with referral code processing ✅
5. Redirects to dashboard ✅

## 🧪 **To Test:**

1. **Test Sign-In Protection:**
   - Go to login page
   - Click "Sign in with Google" with an email that's never signed up
   - Should be redirected to signup page with error message

2. **Test Sign-Up Flow:**
   - Go to signup page  
   - Enter referral code
   - Click "Sign up with Google"
   - Should create account and process referral code

3. **Test Existing User Sign-In:**
   - Go to login page
   - Click "Sign in with Google" with existing user
   - Should sign in successfully

This ensures users cannot bypass the signup process and guarantees all users go through proper onboarding with referral code processing.

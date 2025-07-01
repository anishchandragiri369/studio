# Alternative: Gmail App Password Setup (Easier Option)

Since OAuth is being problematic, let's use Gmail App Passwords instead, which is simpler and more reliable for development.

## Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", enable "2-Step Verification" if not already enabled

## Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter name: "Elixr Studio Email Service" 
5. Click "Generate"
6. **Copy the 16-character app password** (it looks like: `abcd efgh ijkl mnop`)

## Step 3: Update Email Service

I'll modify the email service to use SMTP with app password instead of OAuth.

This approach is:
- ✅ Much simpler to set up
- ✅ More reliable (no token expiration)
- ✅ Easier to maintain
- ✅ Works immediately without complex OAuth flow

## Step 4: Test

Once set up, the password reset emails will work without any OAuth complications.

Would you like me to implement this simpler approach?

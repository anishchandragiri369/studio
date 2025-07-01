# Gmail OAuth2 Refresh Token Regeneration Guide

The current Gmail refresh token appears to be expired or invalid (`invalid_grant` error). Here's how to regenerate it:

## Method 1: Using Google OAuth2 Playground (Recommended)

1. Go to [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)

2. Click the gear icon (⚙️) in the top right corner to access "OAuth 2.0 Configuration"

3. Check "Use your own OAuth credentials" and enter:
   - OAuth Client ID: `1031348146704-109v1ngpe8pbc346d1ckan28al8bspud.apps.googleusercontent.com`
   - OAuth Client Secret: `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`

4. In the left sidebar, find and select:
   - Gmail API v1 → `https://www.googleapis.com/auth/gmail.send`

5. Click "Authorize APIs" and sign in with the account: `anishchandragiri@gmail.com`

6. After authorization, click "Exchange authorization code for tokens"

7. Copy the new "Refresh token" value and update it in your `.env` file:
   ```
   GMAIL_REFRESH_TOKEN=<new_refresh_token_here>
   ```

## Method 2: Using Node.js Script

Create and run this script to generate a new refresh token:

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  '1031348146704-109v1ngpe8pbc346d1ckan28al8bspud.apps.googleusercontent.com',
  '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',
  'https://developers.google.com/oauthplayground'
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Visit this URL to authorize the app:', url);
// After visiting the URL and getting the code, use it like this:
// oauth2Client.getToken(code).then(({ tokens }) => {
//   console.log('Refresh Token:', tokens.refresh_token);
// });
```

## Current Status

- ✅ Mock mode is working correctly
- ❌ Gmail OAuth token needs regeneration
- ✅ Password reset flow logic is implemented
- ✅ Error handling is improved

## Testing

With `EMAIL_MOCK_MODE=true`, the password reset system works perfectly. To test with real emails:

1. Regenerate the Gmail refresh token using the steps above
2. Set `EMAIL_MOCK_MODE=false` in `.env`
3. Test the password reset functionality

## Alternative Solutions

If you prefer not to regenerate the token, you can:

1. Keep using mock mode for development
2. Set up a different email service (SendGrid, AWS SES, etc.)
3. Use a different Gmail account with fresh OAuth credentials

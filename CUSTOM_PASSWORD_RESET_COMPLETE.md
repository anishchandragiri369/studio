# Custom Password Reset System Implementation

## Overview

This document outlines the complete custom password reset system that replaces Supabase's built-in email system with a Gmail SMTP-based solution, providing full control over the password reset flow.

## Architecture

### Components

1. **Frontend Reset Page** (`src/app/reset-password/page.tsx`)
   - Handles both Supabase tokens (legacy) and custom tokens
   - Auto-detects token type from URL parameters
   - POSTs to custom API when custom token is detected

2. **Email Service** (`src/lib/auth-email-service.ts`)
   - Sends emails via Gmail SMTP
   - Generates custom reset links with tokens

3. **API Endpoints**
   - `POST /api/auth/send-reset-password-email-smtp` - Sends reset emails
   - `POST /api/auth/reset-password-with-token` - Validates tokens and resets passwords
   - `GET/POST /api/auth/cleanup-password-reset-tokens` - Manages token cleanup

4. **Database Table** (`password_reset_tokens`)
   - Stores custom reset tokens with expiration
   - Tracks usage to prevent replay attacks

## Database Schema

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Flow Diagram

```
User Request Reset
       ↓
Frontend calls /api/auth/send-reset-password-email-smtp
       ↓
Generate secure token + store in DB
       ↓
Send email via Gmail SMTP with custom link
       ↓
User clicks link with ?token=...
       ↓
Reset page detects custom token
       ↓
User enters new password
       ↓
Frontend POSTs to /api/auth/reset-password-with-token
       ↓
Validate token, update password, mark token as used
       ↓
Success - redirect to login
```

## Environment Variables Required

```env
# Gmail SMTP Configuration
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Supabase (for user management)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL for email links
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Setup Instructions

### 1. Create Database Table

Run the migration:
```bash
node scripts/setup-password-reset-tokens.js
```

Or manually execute:
```sql
-- See sql/create_password_reset_tokens_table.sql
```

### 2. Configure Gmail SMTP

1. Enable 2FA on your Gmail account
2. Generate an App Password for your application
3. Add credentials to `.env` file

### 3. Update AuthContext

The `AuthContext.tsx` already includes the custom reset logic in `sendPasswordReset()`:

```typescript
const sendPasswordReset = async (email: string) => {
  // Uses custom SMTP email instead of Supabase's built-in system
  const response = await fetch('/api/auth/send-reset-password-email-smtp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  // ...
};
```

## API Endpoints

### POST `/api/auth/send-reset-password-email-smtp`

Sends a password reset email with a custom token.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "resetLink": "https://yourdomain.com/reset-password?token=..."
}
```

### POST `/api/auth/reset-password-with-token`

Validates a custom token and updates the user's password.

**Request:**
```json
{
  "token": "secure-reset-token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### GET/POST `/api/auth/cleanup-password-reset-tokens`

Manages cleanup of expired and used tokens.

**GET Response (stats):**
```json
{
  "total": 45,
  "active": 5,
  "expired": 20,
  "used": 20,
  "needsCleanup": 40
}
```

**POST Response (cleanup):**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "remainingTokens": 5
}
```

## Security Features

### Token Security
- **Cryptographically secure**: Uses `crypto.randomUUID()` + timestamp
- **Unique tokens**: Database constraint prevents duplicates
- **Expiration**: Tokens expire after 1 hour by default
- **Single use**: Tokens are marked as used after password reset
- **User isolation**: Tokens are tied to specific user IDs

### Database Security
- **RLS enabled**: Row Level Security prevents unauthorized access
- **Service role only**: Only service role can manage tokens
- **Cascade deletion**: Tokens are deleted when users are deleted

### Rate Limiting (Recommended)
Consider adding rate limiting to prevent abuse:
- Limit reset emails per IP/email address
- Implement exponential backoff for failed attempts

## Testing

### End-to-End Test
```bash
node scripts/test-custom-password-reset.js user@example.com
```

This test verifies:
1. User exists in database
2. Reset email is sent successfully
3. Token is created in database
4. Password reset with token works
5. Token is marked as used
6. Login with new password succeeds

### Manual Testing
1. Go to `/forgot-password`
2. Enter email and submit
3. Check email for reset link
4. Click link (should have `?token=...`)
5. Enter new password and submit
6. Verify login with new password works

## Maintenance

### Token Cleanup
Set up a cron job to clean expired tokens:

```bash
# Call cleanup API every hour
0 * * * * curl -X POST https://yourdomain.com/api/auth/cleanup-password-reset-tokens
```

Or use Supabase Edge Functions with pg_cron:
```sql
SELECT cron.schedule(
  'cleanup-password-reset-tokens',
  '0 * * * *', -- Every hour
  'SELECT cleanup_expired_password_reset_tokens();'
);
```

### Monitoring
- Monitor token creation rates
- Track cleanup effectiveness
- Alert on high token volumes
- Log failed reset attempts

## Migration from Supabase Built-in Reset

### What Changed
- ✅ `sendPasswordReset()` now uses custom SMTP emails
- ✅ Reset page handles both token types (custom + legacy)
- ✅ Custom tokens are validated via new API
- ✅ Passwords are updated via Supabase Admin API

### Backward Compatibility
The system supports both:
- **Legacy Supabase tokens**: `?access_token=...&refresh_token=...`
- **Custom tokens**: `?token=...`

Users with existing Supabase reset links will still work until they expire.

### Complete Migration
To fully migrate:
1. Update all reset links to use custom system
2. Stop using Supabase's `resetPasswordForEmail()`
3. Monitor for any remaining Supabase reset usage
4. Remove legacy token handling after transition period

## Troubleshooting

### Common Issues

1. **"Auth session missing!" error**
   - Ensure custom token is properly extracted from URL
   - Check that token exists in database and isn't expired/used

2. **Email not received**
   - Verify Gmail SMTP credentials
   - Check spam folder
   - Test SMTP connection manually

3. **Token validation fails**
   - Check token format and uniqueness
   - Verify token hasn't expired or been used
   - Ensure database table exists and is accessible

4. **Password update fails**
   - Verify Supabase service role key has admin permissions
   - Check that user exists in auth.users table
   - Ensure password meets strength requirements

### Debug Endpoints

- `GET /api/auth/cleanup-password-reset-tokens` - View token statistics
- Check server logs for detailed error messages
- Use browser dev tools to inspect API requests/responses

## Security Considerations

### Production Recommendations
1. **Use HTTPS only** for all reset links
2. **Implement rate limiting** on reset requests
3. **Log security events** (failed tokens, suspicious activity)
4. **Regular token cleanup** to prevent database bloat
5. **Monitor email delivery** for high bounce rates
6. **Validate email domains** to prevent abuse

### Privacy
- Reset tokens are not logged in plaintext
- Email addresses are validated before processing
- User data is handled according to privacy policies

## Performance

### Database Optimization
- Indexes on `token`, `user_id`, and `expires_at` columns
- Regular cleanup prevents table bloat
- Consider partitioning for high-volume applications

### Email Delivery
- Gmail SMTP is reliable but has rate limits
- Consider upgrading to dedicated email service for high volume
- Monitor delivery rates and bounce handling

## Future Enhancements

### Possible Improvements
1. **Custom email templates** with better styling
2. **Multiple email providers** for redundancy
3. **SMS-based password reset** as alternative
4. **Admin dashboard** for token management
5. **Analytics and reporting** on reset usage
6. **Internationalization** for email content

### Integration Options
- **SendGrid/Mailgun** for production email delivery
- **Twilio** for SMS notifications
- **Redis** for token caching and rate limiting
- **Monitoring tools** for observability

---

## Status: ✅ COMPLETE

The custom password reset system is fully implemented and ready for production use. All components are working together to provide a secure, reliable password reset flow that gives full control over the email and token management process.

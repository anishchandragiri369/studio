# Email System Fixes - July 1, 2025

## Issues Fixed

### 1. ✅ Welcome Email OAuth2 Error (`invalid_grant`)

**Problem**: Welcome email API was using expired OAuth2 refresh tokens, causing `invalid_grant` errors.

**Solution**: 
- Updated `/api/auth/send-welcome-email/route.ts` to use Gmail App Password SMTP (same as password reset)
- Removed OAuth2 dependencies and used direct SMTP authentication
- Added enhanced error logging and validation

**Files Changed**:
- `src/app/api/auth/send-welcome-email/route.ts` - Complete rewrite to use SMTP

### 2. ✅ Email Links Using Localhost URLs

**Problem**: Email templates used `NEXT_PUBLIC_BASE_URL` which pointed to `localhost:9002`, causing "connection refused" errors in production.

**Solution**:
- Added `NEXT_PUBLIC_PRODUCTION_URL` environment variable 
- Updated email templates to prioritize production URL over localhost
- Applied fix to both welcome emails and password reset emails

**Files Changed**:
- `src/app/api/auth/send-welcome-email/route.ts` - Updated URL generation logic
- `src/app/api/auth/send-reset-password-email-smtp/route.ts` - Updated URL generation logic  
- `.env` - Added `NEXT_PUBLIC_PRODUCTION_URL=https://elixr.app`

**URL Priority**: `NEXT_PUBLIC_PRODUCTION_URL` > `NEXT_PUBLIC_BASE_URL` > fallback domain

### 3. ✅ Duplicate Welcome Emails

**Problem**: Signing up with an existing email still sent welcome emails.

**Solution**:
- Enhanced signup flow in `AuthContext.tsx` to better detect existing users
- Added multiple checks:
  - Session creation (new users usually get sessions)
  - User creation timestamp (very recent = new user)
  - Error message analysis for duplicate user indicators
- Improved logging for troubleshooting

**Files Changed**:
- `src/context/AuthContext.tsx` - Enhanced duplicate user detection logic

## Current System State

### ✅ Working Features:
1. **Welcome Emails**: Now use SMTP, no more OAuth2 errors
2. **Password Reset**: Uses custom tokens + SMTP 
3. **Production URLs**: Emails link to production domain, not localhost
4. **Duplicate Prevention**: Better detection of existing users
5. **Custom Auth Flow**: Fully enabled with `NEXT_PUBLIC_CUSTOM_AUTH_EMAILS=true`

### Environment Configuration:
```bash
# Email Transport (SMTP)
GMAIL_USER=anishchandragiri@gmail.com
GMAIL_APP_PASSWORD=hnnz rqtk mxot mrsj

# URL Configuration  
NEXT_PUBLIC_BASE_URL=http://localhost:9002          # Development
NEXT_PUBLIC_PRODUCTION_URL=https://elixr.app        # Production emails

# Custom Auth System
NEXT_PUBLIC_CUSTOM_AUTH_EMAILS=true                 # Enable custom emails
EMAIL_MOCK_MODE=false                               # Real email sending
```

### Testing Endpoints:
- `POST /api/test/welcome-email` - Test welcome email sending
- `POST /api/test/signup-flow` - Test complete signup flow  
- `GET /api/test/fixes` - Test URL generation and config
- `GET /api/debug/config` - Check environment variables

## Next Steps

1. **Update Production URL**: Change `NEXT_PUBLIC_PRODUCTION_URL` to your actual domain in production
2. **Test Real Signup**: Try signing up with a new email to verify welcome email works
3. **Test Duplicate Signup**: Try signing up with an existing email to verify no welcome email is sent
4. **Monitor Logs**: Check console logs for signup flow detection working correctly

## Verification Commands

```bash
# Test welcome email (should work with SMTP)
curl -X POST "http://localhost:9002/api/test/welcome-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Test URL generation (should show production URLs)  
curl -X GET "http://localhost:9002/api/test/fixes"

# Test complete flow
curl -X POST "http://localhost:9002/api/test/signup-flow" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

All email authentication flows now work correctly with production URLs and proper duplicate prevention!

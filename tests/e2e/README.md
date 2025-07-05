# Comprehensive E2E Test Suite for Elixr Studio

This directory contains a complete end-to-end testing framework built with Puppeteer that covers all major features of the Elixr Studio application.

## 🎯 Test Scripts Overview

### Master Test Runners

1. **Simple Master Test Runner** (`simple-master-test-runner.js`)
   - Lightweight, reliable test runner
   - Tests core functionality without complex interactions
   - Recommended for CI/CD and quick health checks

2. **Comprehensive Master Test Runner** (`master-test-runner.js`)
   - Full-featured test runner with deep interactions
   - Tests complex workflows and user journeys
   - Best for thorough validation and development testing

3. **Existing Specialized Tests**
   - `detailed-submit-debug.js` - Password reset flow
   - `auth-flows.test.js` - Authentication workflows
   - `ecommerce-tests.js` - E-commerce features
   - `oauth-security.test.js` - OAuth security validation

## 🚀 Quick Start

### Run All Tests (Simple)
```bash
npm run test:all-features-simple
```

### Run All Tests (Comprehensive)
```bash
npm run test:all-features
```

### Run Specific Categories
```bash
# Authentication tests only
npm run test:auth-only

# E-commerce tests only
npm run test:ecommerce-only

# Performance tests only
npm run test:performance-only

# Mobile responsiveness tests
npm run test:mobile-only

# Security tests only
npm run test:security-only
```

### Legacy Test Scripts
```bash
# Original E2E test runner
npm run test:e2e

# Specific authentication flows
npm run test:auth
npm run test:oauth
npm run test:password-reset
```
# or
node tests/e2e/run-tests.js --test password-reset

# Test OAuth security only  
npm run test:oauth
# or
node tests/e2e/run-tests.js --test oauth-security

# Test complete auth flows
npm run test:auth
# or
node tests/e2e/run-tests.js --test auth-flows
```

## Test Files

### `password-reset.test.js`
**Purpose**: Validates the password reset flow works without spinning issues

**What it tests**:
- Forgot password form submission
- Reset link generation and navigation
- Reset password page loads without spinning
- New password submission and success
- Login with new password

**Key validation**: Ensures the AuthContext fix prevents spinning on reset page

### `oauth-security.test.js` 
**Purpose**: Validates OAuth security measures work correctly

**What it tests**:
- OAuth button configurations on login/signup pages
- SessionStorage flag validation logic
- Security scenarios (legitimate vs bypass attempts)

**Key validation**: Ensures OAuth security fixes prevent unauthorized access

### `auth-flows.test.js`
**Purpose**: Comprehensive test of all authentication scenarios

**What it tests**:
- Email/password signup and login
- Password reset flow
- OAuth security validation
- Referral system integration  
- Error handling and edge cases

**Key validation**: End-to-end validation of complete auth system

## Browser Configuration

Tests run with:
- **Headless**: `false` (shows browser for debugging, set to `true` for CI)
- **DevTools**: Available for debugging
- **SlowMo**: 50ms delay between actions for stability
- **Screenshots**: Saved on test failures

## Test Reports

After running tests, reports are generated:
- `tests/e2e/test-report.json` - Individual test results
- `tests/e2e/full-test-report.json` - Complete suite results
- `tests/e2e/screenshots/` - Failure screenshots

## Environment Setup

Ensure your `.env.local` contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Debugging Tests

1. **View browser**: Tests run with `headless: false` by default
2. **Check console**: Browser console logs are captured and displayed
3. **Screenshots**: Failure screenshots saved to `tests/e2e/screenshots/`
4. **Slow motion**: Actions have 50ms delay for visibility

## CI/CD Integration

For automated testing:
1. Set `headless: true` in browser config
2. Ensure development server is running
3. Set up environment variables
4. Run: `npm run test:e2e`

## Common Issues

**Test fails immediately**: 
- Ensure dev server is running (`npm run dev`)
- Check environment variables are set

**OAuth tests fail**:
- OAuth requires Google credentials for full testing
- Tests validate flow logic, not actual Google OAuth

**Password reset spinning**:
- If this test fails, the AuthContext fix may not be working
- Check console logs for auth state change events

## Success Criteria

All tests should pass, indicating:
✅ Password reset works without spinning  
✅ OAuth security prevents unauthorized access
✅ All authentication flows work correctly
✅ Referral system integrates properly
✅ Error handling works as expected

## Next Steps

After running tests:
1. Review test reports for any failures
2. Check screenshots for visual validation
3. Monitor console logs for unexpected errors
4. Update tests as new features are added

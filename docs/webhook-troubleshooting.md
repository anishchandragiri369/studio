# Webhook Troubleshooting Guide

## Current Issue
The payment webhook is failing with a 500 Internal Server Error. This indicates an issue in the webhook processing logic.

## Changes Made

### 1. Enhanced Error Handling
- Added detailed error logging with stack traces
- Improved error messages with timestamps
- Added safety checks for database operations

### 2. Fixed Order Status Values
- Changed from `payment_success`/`payment_failed` to `Payment Success`/`Payment Failed`
- These match the expected status values in the Order type definition

### 3. Improved Email Integration
- Removed dependency on legacy `orderDetails` parameter
- The robust email API now fetches all data from the database
- Added graceful handling of email failures (won't fail the webhook)

### 4. Enhanced Logging
- Added comprehensive logging at each step
- Logs webhook payload, order fetching, status updates, and email sending
- Added start/end markers for easier debugging

### 5. Created Debugging Tools
- `webhook-test.js`: Utility for testing webhook locally
- Test pages: `/test-webhook` and `/test-email` for debugging

## Debugging Steps

### Step 1: Check Environment Variables
Ensure these are set in Netlify environment:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
CASHFREE_SECRET_KEY
GMAIL_USER
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
ADMIN_EMAIL
SEND_ORDER_EMAIL_API_URL (optional)
SUBSCRIPTION_CREATE_API_URL (optional)
```

### Step 2: Verify Database Schema
Check that the `orders` table has:
- `status` column that accepts: 'Payment Pending', 'Payment Success', 'Payment Failed'
- `email` or `customer_email` field populated
- `items` field as JSONB with proper structure
- `order_type` field ('regular' or 'subscription')
- `subscription_info` field for subscription orders

### Step 3: Test Order Creation
1. Create a test order through the checkout flow
2. Verify it appears in Supabase with 'Payment Pending' status
3. Note the order ID for testing

### Step 4: Test Email System
1. Go to `/test-email` page
2. Enter the order ID
3. Test if emails are sent successfully
4. This will validate the email system independently

### Step 5: Monitor Webhook Logs
1. Check Netlify Functions dashboard
2. Look for detailed error logs in the webhook function
3. The enhanced logging will show exactly where it's failing

### Step 6: Test Webhook Locally (if needed)
1. Use the `/test-webhook` page to simulate webhook calls
2. Or run the webhook-test.js utility locally

## Common Issues & Solutions

### Issue 1: Order Not Found
**Symptoms**: 404 error, "Order not found"
**Solution**: 
- Verify the order ID exists in Supabase
- Check that the order ID format is correct (without elixr_ prefix in DB)

### Issue 2: Database Update Failure
**Symptoms**: 500 error on status update
**Solution**:
- Check if status column accepts the new values
- Verify Supabase permissions
- Check for any database constraints

### Issue 3: Email Sending Failure
**Symptoms**: Webhook processes but no emails sent
**Solution**:
- Check Gmail OAuth2 configuration
- Verify ADMIN_EMAIL is set
- Check email API logs

### Issue 4: Signature Verification Failure
**Symptoms**: 401 Unauthorized error
**Solution**:
- Verify CASHFREE_SECRET_KEY is correct
- Check webhook URL configuration in Cashfree dashboard

## Next Steps

1. **Deploy the Updated Webhook**: The current fixes should resolve the 500 error
2. **Check Environment Variables**: Ensure all required variables are set in Netlify
3. **Test with Real Payment**: Create a test order and complete payment
4. **Monitor Logs**: Watch the Netlify Functions dashboard for detailed error information
5. **Use Debug Tools**: Utilize the test pages to isolate any remaining issues

## Webhook Flow (After Fixes)

1. **Receive Webhook**: Enhanced logging shows all incoming data
2. **Verify Signature**: Detailed error logging if this fails
3. **Parse Data**: Extract order ID and validate format
4. **Update Order Status**: Use correct status values with error handling
5. **Fetch Order**: Comprehensive error logging for database issues
6. **Create Subscription**: (if applicable) Enhanced error handling
7. **Send Emails**: Graceful failure handling - won't break webhook
8. **Return Success**: Detailed success response

The enhanced error handling and logging should provide much clearer information about what's causing the 500 error, making it easier to identify and fix the specific issue.

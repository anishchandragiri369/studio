# Daily Subscription Report System

## Overview
Automatically generates and emails comprehensive subscription reports every day at 6 PM with detailed Excel spreadsheets containing all subscription data.

## Required Environment Variables

Add these to your Netlify environment variables:

```bash
# Existing email configuration (already set up)
GMAIL_USER=your-gmail@gmail.com
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# Admin email (where reports will be sent)
ADMIN_EMAIL=admin@elixr.com

# Optional: CC additional emails (comma-separated)
SUBSCRIPTION_REPORT_CC_EMAILS=manager@elixr.com,owner@elixr.com

# Cron job security token
CRON_SECRET=your-secure-random-token

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://develixr.netlify.app
```

## Features

### Excel Report Contains:
- **Subscription Details**: ID, Plan, Status, Duration, Pricing
- **Customer Information**: Name, Email, Phone
- **Delivery Address**: Complete address details
- **Selected Juices**: All juices in each subscription with quantities
- **Dates**: Start, End, Next Delivery, Pause dates
- **Financial Summary**: Revenue totals, discount information
- **Status Summary**: Active, Paused, Expired counts

### Email Features:
- **Professional HTML email** with subscription summary
- **Excel attachment** with complete data
- **Automatic scheduling** at 6 PM daily
- **CC support** for multiple recipients
- **Error handling** and logging

## API Endpoints

### 1. Daily Report Generator
```
POST /api/daily-subscription-report
Authorization: Bearer <CRON_SECRET>
```

### 2. Manual Test Trigger
```
POST /api/test-daily-report
```

### 3. Download Report (Manual)
```
GET /api/daily-subscription-report
```

## Testing

### Manual Test:
1. Visit: `https://develixr.netlify.app/api/test-daily-report` (POST)
2. Check admin email for report
3. Verify Excel file contains all data

### Direct Download:
1. Visit: `https://develixr.netlify.app/api/daily-subscription-report` (GET)
2. Downloads Excel file directly

## Scheduling

The system uses Netlify's cron functionality to automatically trigger the report daily at 6 PM UTC.

### Cron Configuration (netlify.toml):
```toml
[[plugins]]
  package = "netlify-plugin-cron"

  [plugins.inputs]
    jobs = [
      {
        name = "daily-subscription-report",
        cron = "0 18 * * *",
        command = "curl -X POST https://develixr.netlify.app/.netlify/functions/daily-subscription-report-cron"
      }
    ]
```

## Setup Instructions

1. **Install Dependencies** (already done):
   ```bash
   npm install exceljs @netlify/functions
   ```

2. **Set Environment Variables** in Netlify:
   - Go to Site Settings > Environment Variables
   - Add all required variables listed above

3. **Deploy to Netlify**:
   - The cron job will automatically start working
   - Reports will be sent daily at 6 PM

4. **Test Setup**:
   - Use the test endpoint to verify everything works
   - Check admin email for the test report

## Troubleshooting

### Common Issues:
1. **Email not received**: Check GMAIL_* environment variables
2. **Excel file empty**: Verify Supabase connection and data
3. **Cron not running**: Check Netlify function logs
4. **Authorization errors**: Verify CRON_SECRET matches

### Logs Location:
- Netlify Functions logs in dashboard
- Console logs in browser network tab for manual tests

## Security

- **Authorization required** for cron endpoint
- **CRON_SECRET** prevents unauthorized access
- **Email sent only to admin** and CC addresses
- **No sensitive data** exposed in logs

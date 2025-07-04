# Admin Delivery Schedule Settings

## Overview

This feature allows administrators to configure delivery intervals for different subscription types instead of using fixed rules. You can now set custom delivery gaps and choose between daily or gapped delivery schedules.

## Features

### 1. Database Tables Created
- `delivery_schedule_settings`: Stores delivery configuration for each subscription type
- `delivery_schedule_audit`: Tracks all changes made to delivery settings

### 2. Subscription Types Supported
- **Juices**: Default 7-day gap (weekly delivery)
- **Fruit Bowls**: Default daily delivery (no gap)
- **Customized**: Default 3-day gap

### 3. Admin Interface
Access the delivery schedule settings at: `/admin/delivery-schedule`

#### Features:
- **Edit Settings**: Configure delivery gaps and daily/gapped delivery for each subscription type
- **Audit Trail**: View history of all changes with timestamps and admin details
- **Live Preview**: See how delivery schedules will look with current settings

### 4. API Endpoints

#### Get Settings
```
GET /api/admin/delivery-schedule
```
Returns all active delivery schedule settings.

#### Update Settings
```
POST /api/admin/delivery-schedule
{
  "subscription_type": "juices",
  "delivery_gap_days": 7,
  "is_daily": false,
  "description": "Weekly delivery for juices",
  "change_reason": "Business requirement change"
}
```

#### Get Audit History
```
GET /api/admin/delivery-schedule/audit?subscription_type=juices&limit=50
```

#### Test Delivery Settings
```
GET /api/admin/test-delivery-settings?subscriptionType=juices&action=preview&startDate=2025-07-05&previewDays=14
```

## How It Works

### 1. Setting Up Database
Run the SQL script to create the necessary tables and functions:
```sql
-- Run: sql/delivery-schedule-settings.sql
```

### 2. Configuring Delivery Schedules

1. Go to `/admin/delivery-schedule`
2. Click "Edit Settings" on any subscription type card
3. Choose:
   - **Daily**: Deliveries every day (excluding Sundays)
   - **With Gap**: Deliveries every X days (excluding Sundays)
4. Set the gap days (1-30 days)
5. Update the description
6. Provide a reason for the change
7. Click "Save"

### 3. Delivery Schedule Logic

#### For Daily Delivery (`is_daily = true`):
- Delivers every single day except Sundays
- Example: Mon, Tue, Wed, Thu, Fri, Sat, Mon, Tue...

#### For Gapped Delivery (`is_daily = false`):
- Delivers every `delivery_gap_days + 1` days except Sundays
- Gap of 1 = every other day (Mon, Wed, Fri...)
- Gap of 2 = every 3 days (Mon, Thu, Sun→Mon...)
- Gap of 6 = weekly (Mon, Mon, Mon...)

### 4. Integration with Existing System

The new scheduler integrates with your existing delivery system:

```typescript
import { 
  generateSubscriptionDeliveryDatesWithSettings,
  calculateNextDeliveryDateWithSettings 
} from '@/lib/deliverySchedulerWithSettings';

// Generate delivery schedule based on admin settings
const deliveryDates = await generateSubscriptionDeliveryDatesWithSettings(
  'juices', // subscription type
  3,        // duration in months
  new Date() // start date
);

// Calculate next delivery date for existing subscription
const nextDate = await calculateNextDeliveryDateWithSettings(
  'fruit_bowls',
  new Date() // current delivery date
);
```

## Testing

### 1. Test API
Use the test endpoint to preview delivery schedules:
```
GET /api/admin/test-delivery-settings?subscriptionType=juices&action=preview&startDate=2025-07-05&previewDays=14
```

### 2. Admin Interface Testing
1. Go to `/admin/delivery-schedule`
2. Change settings for any subscription type
3. View the preview of upcoming delivery dates
4. Check the audit history to verify changes are logged

## Business Impact

### For Juices (Default: Weekly)
- Reduces delivery frequency from daily to weekly
- Easier inventory management
- Better for customers who want bulk juice deliveries

### For Fruit Bowls (Default: Daily)
- Maintains fresh daily deliveries
- Perfect for daily health routines
- No storage issues for customers

### For Customized (Default: Every 3 Days)
- Balanced approach between daily and weekly
- Flexible for mixed product subscriptions
- Can be adjusted based on customer feedback

## Migration Notes

### Backward Compatibility
- Existing `deliveryScheduler.ts` functions still work
- New functions in `deliverySchedulerWithSettings.ts` use database settings
- Can gradually migrate to settings-based approach

### Database Migration
1. Run the SQL script to create tables
2. Default settings are automatically inserted
3. No data loss for existing subscriptions

### Updating Subscription Creation
Update your subscription creation APIs to use the new scheduler:

```typescript
// Old way
const deliveryDates = generateSubscriptionDeliveryDates('weekly', 3, startDate);

// New way (uses admin settings)
const deliveryDates = await generateSubscriptionDeliveryDatesWithSettings('juices', 3, startDate);
```

## Configuration Examples

### Example 1: Daily Fruit Bowls
```json
{
  "subscription_type": "fruit_bowls",
  "delivery_gap_days": 1,
  "is_daily": true,
  "description": "Fresh fruit bowls delivered daily"
}
```
**Result**: Mon, Tue, Wed, Thu, Fri, Sat, Mon, Tue...

### Example 2: Weekly Juices
```json
{
  "subscription_type": "juices",
  "delivery_gap_days": 6,
  "is_daily": false,
  "description": "Weekly juice delivery every Monday"
}
```
**Result**: Mon, Mon, Mon, Mon... (weekly)

### Example 3: Every Other Day Customized
```json
{
  "subscription_type": "customized",
  "delivery_gap_days": 1,
  "is_daily": false,
  "description": "Customized items every other day"
}
```
**Result**: Mon, Wed, Fri, Mon, Wed, Fri...

## Troubleshooting

### Settings Not Loading
- Check if SQL script was run successfully
- Verify database permissions for admin users
- Check browser console for API errors

### Changes Not Reflected
- Clear the delivery settings cache: 
  ```
  POST /api/admin/test-delivery-settings
  { "action": "clear-cache" }
  ```
- Restart the application if needed

### Audit Trail Missing
- Ensure RLS policies are set up correctly
- Check if admin user has proper permissions
- Verify the `auth.users` table exists and is accessible

## Security

- All tables use Row Level Security (RLS)
- Only authenticated admin users can modify settings
- All changes are audited with user information
- Settings are cached for performance but can be cleared

## Future Enhancements

1. **Holiday Scheduling**: Skip deliveries on specific holidays
2. **Custom Delivery Days**: Choose specific days of the week
3. **Regional Settings**: Different schedules for different areas
4. **Seasonal Adjustments**: Automatically adjust schedules by season
5. **Customer Preferences**: Let customers choose their preferred schedule within admin limits

# 6 PM Cutoff Implementation for Subscription Reactivation

## Overview

The subscription reactivation system now implements a 6 PM cutoff rule that determines when the next delivery should be scheduled:

- **Before 6 PM**: Next delivery = Next day
- **After 6 PM**: Next delivery = Day after next
- **Sundays**: Automatically skipped (moved to Monday)
- **Delivery time**: Set to 8 AM

## Implementation Details

### 1. JavaScript/TypeScript Implementation

#### Core Logic in `SubscriptionManager.ts`

```typescript
/**
 * Calculate next delivery date with 6 PM cutoff logic for reactivation
 * If reactivated before 6 PM: next delivery is next day
 * If reactivated after 6 PM: next delivery is day after next
 * Excludes Sundays
 */
static calculateNextDeliveryDateWithCutoff(reactivationDate: Date): Date {
  const now = new Date(reactivationDate);
  const currentHour = now.getHours();
  
  let nextDeliveryDate: Date;
  if (currentHour >= 18) { // 6 PM or later
    // Schedule delivery for day after tomorrow
    nextDeliveryDate = new Date(now);
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 2);
  } else {
    // Schedule delivery for tomorrow
    nextDeliveryDate = new Date(now);
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
  }
  
  // Set delivery time to 8 AM
  nextDeliveryDate.setHours(8, 0, 0, 0);
  
  // Skip Sunday if needed
  if (nextDeliveryDate.getDay() === 0) {
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1);
  }
  
  return nextDeliveryDate;
}
```

#### Enhanced Reactivation Schedule Method

```typescript
/**
 * Calculate reactivation delivery scheduling with 6 PM cutoff logic
 * If reactivated before 6 PM: next delivery is next day
 * If reactivated after 6 PM: next delivery is day after next
 * Maintains alternate day pattern and excludes Sundays
 */
static calculateReactivationDeliverySchedule(
  reactivationDate: Date, 
  frequency: 'weekly' | 'monthly' = 'monthly',
  previousDeliveryDates: Date[] = []
): { nextDeliveryDate: Date; adjustedSchedule: Date[] } {
  const nextDeliveryDate = this.calculateNextDeliveryDateWithCutoff(reactivationDate);
  
  if (frequency === 'weekly') {
    return {
      nextDeliveryDate,
      adjustedSchedule: this.getUpcomingDeliveries(nextDeliveryDate, 'weekly', 4)
    };
  }
  
  // For monthly subscriptions, maintain alternate day pattern
  // Generate new schedule maintaining alternate day pattern (skip 1 day between deliveries)
  const newSchedule: Date[] = [];
  let currentScheduleDate = new Date(nextDeliveryDate);
  let deliveriesAdded = 0;
  
  // Generate delivery dates maintaining alternate day pattern with Sunday exclusion
  while (deliveriesAdded < 10) {
    // Skip Sundays
    if (currentScheduleDate.getDay() !== 0) {
      newSchedule.push(new Date(currentScheduleDate));
      deliveriesAdded++;
    }
    
    // Move to next delivery date (alternate day pattern: skip 1 day)
    currentScheduleDate.setDate(currentScheduleDate.getDate() + 2);
    
    // If we land on Sunday, move to Monday
    if (currentScheduleDate.getDay() === 0) {
      currentScheduleDate.setDate(currentScheduleDate.getDate() + 1);
    }
  }
  
  return {
    nextDeliveryDate,
    adjustedSchedule: newSchedule
  };
}
```

### 2. Database Implementation

#### SQL Function in `admin_subscription_pause_system.sql`

```sql
-- Create function to calculate next delivery date with proper scheduling logic
CREATE OR REPLACE FUNCTION calculate_reactivation_delivery_date(
    reactivation_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    next_delivery TIMESTAMP WITH TIME ZONE;
    reactivation_hour INTEGER;
BEGIN
    -- Get the hour of reactivation
    reactivation_hour := EXTRACT(HOUR FROM reactivation_timestamp);
    
    -- Calculate base delivery date based on 6 PM cutoff
    IF reactivation_hour >= 18 THEN
        -- After 6 PM: schedule for day after next
        next_delivery := (reactivation_timestamp::date + INTERVAL '2 days')::timestamp + TIME '08:00:00';
    ELSE
        -- Before 6 PM: schedule for next day
        next_delivery := (reactivation_timestamp::date + INTERVAL '1 day')::timestamp + TIME '08:00:00';
    END IF;
    
    -- Skip Sunday (move to Monday if delivery falls on Sunday)
    WHILE EXTRACT(DOW FROM next_delivery) = 0 LOOP
        next_delivery := next_delivery + INTERVAL '1 day';
    END LOOP;
    
    RETURN next_delivery;
END;
$$ LANGUAGE plpgsql;
```

### 3. API Endpoints Updated

#### Main Subscription Reactivation (`/api/subscriptions/reactivate/route.ts`)

- Uses `SubscriptionManager.updateDeliveryScheduleAfterReactivation()`
- Implements 6 PM cutoff logic
- Maintains alternate day pattern for monthly subscriptions
- Extends subscription end date by pause duration

#### Fruit Bowl Reactivation (`/api/fruit-bowls/subscriptions/reactivate/route.ts`)

- Updated to use `SubscriptionManager.calculateNextDeliveryDateWithCutoff()`
- Implements same 6 PM cutoff logic
- Consistent with main subscription reactivation

#### Admin Reactivation (`/api/admin/subscriptions/reactivate/route.ts`)

- Uses `SubscriptionManager.updateDeliveryScheduleAfterReactivation()`
- Implements 6 PM cutoff logic
- Generates new delivery schedules for reactivated subscriptions

## Test Cases and Validation

### Test Scenarios Verified

1. **Before 6 PM (2 PM)**: Next delivery = Next day
2. **After 6 PM (8 PM)**: Next delivery = Day after next
3. **Exactly at 6 PM**: Next delivery = Day after next
4. **Sunday exclusion**: Automatically moves to Monday
5. **Edge cases**: 5:59 PM vs 6:00 PM
6. **Sunday exclusion with after 6 PM**: Friday 8 PM → Monday 8 AM

### Test Results

```
📋 Test Case 1: Reactivation at 2 PM (before 6 PM)
✅ Correctly scheduled for next day (before 6 PM reactivation)

📋 Test Case 2: Reactivation at 8 PM (after 6 PM)
✅ Correctly scheduled for day after next (after 6 PM reactivation)

📋 Test Case 3: Reactivation exactly at 6 PM
✅ Correctly scheduled for day after next (at 6 PM reactivation)

📋 Test Case 4: Sunday exclusion test
✅ Correctly skipped Sunday and scheduled for Monday

📋 Test Case 5: Sunday exclusion with after 6 PM reactivation
✅ Correctly skipped Sunday and scheduled for Monday (after 6 PM)

📋 Test Case 6: Edge case - 5:59 PM
✅ Correctly scheduled for next day (5:59 PM reactivation)

📋 Test Case 7: Edge case - 6:00 PM
✅ Correctly scheduled for day after next (6:00 PM reactivation)
```

## Usage Examples

### User Reactivation Flow

1. User pauses subscription
2. User clicks "Reactivate Subscription"
3. System checks current time:
   - If before 6 PM: Next delivery = Tomorrow 8 AM
   - If after 6 PM: Next delivery = Day after next 8 AM
4. System skips Sundays if needed
5. Subscription is reactivated with new delivery schedule

### Admin Reactivation Flow

1. Admin selects paused subscriptions
2. Admin clicks "Reactivate Selected"
3. System applies 6 PM cutoff logic to each subscription
4. New delivery schedules are generated
5. Subscriptions are reactivated with proper timing

## Benefits

1. **Consistent Logic**: All reactivation endpoints use the same 6 PM cutoff logic
2. **User-Friendly**: Clear expectations for when deliveries will resume
3. **Operational Efficiency**: Gives delivery team adequate notice
4. **Sunday Handling**: Automatically avoids Sunday deliveries
5. **Edge Case Handling**: Properly handles exact 6 PM timing

## Files Modified

1. `src/lib/subscriptionManager.ts` - Added `calculateNextDeliveryDateWithCutoff()` method
2. `src/app/api/fruit-bowls/subscriptions/reactivate/route.ts` - Updated to use 6 PM cutoff
3. `sql/admin_subscription_pause_system.sql` - SQL function already implemented
4. `scripts/test-reactivation-cutoff.js` - Comprehensive test suite

## Future Enhancements

1. **Time Zone Support**: Currently uses server time, could be enhanced for user time zones
2. **Custom Cutoff Times**: Could be made configurable per region or business needs
3. **Holiday Exclusion**: Could be extended to exclude holidays as well as Sundays
4. **Delivery Window**: Could support different delivery time windows

## Conclusion

The 6 PM cutoff logic for subscription reactivation is now fully implemented and tested across all relevant endpoints. The system provides consistent, predictable delivery scheduling that gives both users and the delivery team clear expectations for when deliveries will resume after reactivation. 
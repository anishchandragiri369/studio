# Subscription Analytics & Enhanced Delivery Scheduling

This document covers the implementation of advanced subscription analytics and enhanced delivery scheduling with customer time window preferences.

## Features Implemented

### 📊 Subscription Analytics System
- **Revenue Analytics**: Track revenue trends across different subscription types
- **Customer Acquisition Metrics**: Monitor new customer acquisition by channel
- **Churn Analysis**: Analyze customer churn patterns and reasons
- **Growth Rate Calculations**: Measure subscription business growth
- **Real-time Dashboard**: Interactive charts and KPI monitoring

### 🚚 Enhanced Delivery Scheduling
- **Customer Time Windows**: Allow customers to select preferred delivery times
- **Capacity Management**: Track and manage delivery capacity by time slot
- **Flexible Scheduling**: Alternative time windows and flexibility options
- **Admin Management**: Full CRUD operations for delivery time windows
- **Smart Allocation**: Automatic time slot assignment based on preferences

## Database Schema

### Analytics Tables
The analytics system leverages existing subscription data and extends it with new calculated metrics:

```sql
-- Revenue tracking across subscription types
-- Uses: user_subscriptions, gift_subscriptions, corporate_subscriptions, subscription_transfer_transactions

-- Customer acquisition tracking
-- Uses: user_subscriptions, gift_subscriptions, family_group_members, corporate_employees

-- Churn analysis
-- Uses: user_subscriptions (status changes), gift_subscriptions (expiry), family_group_members (departures)
```

### Delivery Scheduling Tables
```sql
-- Delivery time windows
CREATE TABLE delivery_time_windows (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    delivery_fee_modifier DECIMAL(5,2) DEFAULT 0,
    max_capacity INTEGER DEFAULT 50,
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer delivery preferences
CREATE TABLE customer_delivery_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    preferred_time_window_id UUID REFERENCES delivery_time_windows(id),
    alternative_time_window_id UUID REFERENCES delivery_time_windows(id),
    special_instructions TEXT,
    is_flexible BOOLEAN DEFAULT TRUE,
    preferred_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
    avoid_days INTEGER[] DEFAULT ARRAY[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced subscription deliveries
ALTER TABLE subscription_deliveries ADD COLUMNS:
- delivery_time_window_id UUID
- scheduled_start_time TIMESTAMP WITH TIME ZONE
- scheduled_end_time TIMESTAMP WITH TIME ZONE
- actual_delivery_time TIMESTAMP WITH TIME ZONE
- delivery_instructions TEXT
- delivery_rating INTEGER (1-5)
- delivery_feedback TEXT
```

## API Endpoints

### Analytics APIs
```typescript
// Get comprehensive subscription analytics
GET /api/subscription-analytics
Query params: startDate, endDate, granularity, metric

// Generate custom analytics report
POST /api/subscription-analytics
Body: { startDate, endDate, granularity, metrics[] }
```

### Delivery Window APIs
```typescript
// Get available time windows for a date
GET /api/delivery-windows
Query params: date, userId

// Save customer delivery preferences
POST /api/delivery-windows
Body: DeliveryPreferencesFormData

// Admin: Manage delivery time windows
GET/POST/PUT/DELETE /api/admin/delivery-windows
```

## Frontend Components

### Analytics Dashboard
- **File**: `src/components/admin/SubscriptionAnalyticsDashboard.tsx`
- **Features**:
  - Revenue trend charts (Area, Bar, Pie charts)
  - Customer acquisition metrics
  - Churn analysis with reasons
  - Interactive date range and granularity controls
  - Export functionality

### Delivery Window Selector
- **File**: `src/components/subscriptions/DeliveryWindowSelector.tsx`
- **Features**:
  - Time window selection with availability
  - Alternative window selection
  - Day preferences configuration
  - Special delivery instructions
  - Flexible scheduling options

### Admin Delivery Management
- **File**: `src/components/admin/DeliveryWindowManagement.tsx`
- **Features**:
  - Time window CRUD operations
  - Real-time capacity monitoring
  - Utilization rate tracking
  - Bulk window management

## Pages & Routes

### Admin Dashboard
- **Route**: `/admin/advanced-features`
- **Tabs**: Overview, Analytics, Delivery, Gifts, Family, Corporate, Transfers
- **File**: `src/app/admin/advanced-features/page.tsx`

### Delivery Preferences
- **Route**: `/subscriptions/delivery-preferences`
- **Purpose**: Customer delivery time window setup
- **File**: `src/app/subscriptions/delivery-preferences/page.tsx`

## Integration Points

### Subscription Flow Integration
1. **Plan Selection** → `/subscriptions/subscribe`
2. **Delivery Preferences** → `/subscriptions/delivery-preferences` (optional)
3. **Cart & Checkout** → `/cart`

### Admin Dashboard Integration
- Analytics tab shows comprehensive subscription metrics
- Delivery tab manages time windows and capacity
- Real-time stats and utilization monitoring

## Analytics Metrics

### Revenue Analytics
- **Total Revenue**: Sum of all subscription revenues
- **Revenue by Source**: Regular, Gift, Corporate, Transfer fees
- **Growth Rate**: Period-over-period revenue growth
- **Revenue Trends**: Daily/weekly/monthly breakdown

### Customer Acquisition
- **New Customers**: First-time subscribers
- **Acquisition Channels**: Direct, Gift, Family, Corporate
- **Conversion Rates**: Visitors to subscribers ratio
- **Acquisition Cost**: Revenue per acquisition channel

### Churn Analysis
- **Churn Rate**: Monthly customer churn percentage
- **Retention Rate**: Customer retention percentage
- **Churn Reasons**: Categorized cancellation reasons
- **Churn Trends**: Time-based churn patterns

## Delivery Window Features

### Customer Features
- **Time Window Selection**: Choose from available delivery slots
- **Alternative Preferences**: Backup time window selection
- **Day Preferences**: Preferred delivery days of week
- **Flexibility Options**: Allow system to adjust if needed
- **Special Instructions**: Custom delivery notes

### Admin Features
- **Window Management**: Create, edit, delete time windows
- **Capacity Control**: Set maximum deliveries per window
- **Fee Modifiers**: Premium charges for peak times
- **Availability Tracking**: Real-time slot availability
- **Utilization Monitoring**: Track window usage patterns

## Performance Considerations

### Analytics Optimization
- **Caching**: Revenue calculations cached for performance
- **Aggregation**: Pre-calculated metrics for common queries
- **Pagination**: Large datasets paginated for responsiveness
- **Indexing**: Database indexes on date and status fields

### Delivery Scheduling Optimization
- **Capacity Checking**: Efficient slot availability queries
- **Preference Matching**: Optimized preference-to-slot matching
- **Real-time Updates**: Live capacity updates during booking

## Usage Examples

### Fetching Analytics Data
```typescript
// Get last 30 days revenue trends
const response = await fetch('/api/subscription-analytics?startDate=2024-01-01&endDate=2024-01-31&granularity=daily&metric=revenue');
const data = await response.json();

// Generate comprehensive report
const report = await fetch('/api/subscription-analytics', {
  method: 'POST',
  body: JSON.stringify({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    granularity: 'weekly',
    metrics: ['revenue', 'acquisition', 'churn']
  })
});
```

### Setting Delivery Preferences
```typescript
// Save customer delivery preferences
const preferences = await fetch('/api/delivery-windows', {
  method: 'POST',
  body: JSON.stringify({
    subscriptionId: 'sub_123',
    userId: 'user_456',
    preferredTimeWindowId: 'window_789',
    alternativeTimeWindowId: 'window_012',
    specialInstructions: 'Leave at front door',
    isFlexible: true,
    preferredDays: [1, 2, 3, 4, 5], // Mon-Fri
    avoidDays: [0, 6] // Avoid weekends
  })
});
```

### Admin Time Window Management
```typescript
// Create new delivery window
const newWindow = await fetch('/api/admin/delivery-windows', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Express Morning',
    startTime: '08:00:00',
    endTime: '10:00:00',
    maxCapacity: 25,
    deliveryFeeModifier: 5.00,
    daysOfWeek: [1, 2, 3, 4, 5],
    isActive: true
  })
});
```

## Security & Validation

### Input Validation
- Time format validation (HH:MM:SS)
- Capacity limits (1-1000 deliveries)
- Date range validation
- User authorization checks

### Data Protection
- Admin-only access to analytics APIs
- User-specific delivery preferences
- Rate limiting on analytics endpoints
- Secure time window management

## Testing

### Analytics Testing
```bash
# Test revenue calculations
npm test -- analytics.test.js

# Test customer acquisition metrics
npm test -- acquisition.test.js

# Test churn analysis
npm test -- churn.test.js
```

### Delivery Testing
```bash
# Test delivery window selection
npm test -- delivery-windows.test.js

# Test capacity management
npm test -- capacity.test.js

# Test preference saving
npm test -- preferences.test.js
```

## Future Enhancements

### Analytics Enhancements
- **Predictive Analytics**: Machine learning for churn prediction
- **Cohort Analysis**: Customer lifecycle analysis
- **Revenue Forecasting**: Predictive revenue modeling
- **A/B Testing**: Feature impact measurement

### Delivery Enhancements
- **Route Optimization**: Delivery route planning
- **Real-time Tracking**: Live delivery tracking
- **Dynamic Pricing**: Demand-based pricing
- **Capacity Predictions**: AI-powered capacity planning

## Troubleshooting

### Common Issues

1. **Analytics Not Loading**
   - Check Supabase service role key
   - Verify database permissions
   - Check console for API errors

2. **Delivery Windows Not Showing**
   - Ensure time windows are active
   - Check date range (future dates only)
   - Verify database connectivity

3. **Performance Issues**
   - Enable caching for analytics
   - Optimize database queries
   - Use pagination for large datasets

### Debug Commands
```bash
# Check analytics API
curl -X GET "http://localhost:3000/api/subscription-analytics?startDate=2024-01-01&endDate=2024-01-31"

# Test delivery windows
curl -X GET "http://localhost:3000/api/delivery-windows?date=2024-02-01"

# Check admin access
curl -X GET "http://localhost:3000/api/admin/delivery-windows?includeStats=true"
```

## Conclusion

The subscription analytics and enhanced delivery scheduling system provides comprehensive insights into business performance and significantly improves the customer delivery experience. The modular design allows for easy extension and customization based on business needs.

Key benefits:
- **Data-driven Decisions**: Rich analytics for business intelligence
- **Customer Satisfaction**: Flexible delivery scheduling
- **Operational Efficiency**: Optimized delivery capacity management
- **Scalability**: Built for growth and expansion

For support or questions, refer to the API documentation or contact the development team.

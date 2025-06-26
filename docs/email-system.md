# Order Confirmation Email System

This document describes the robust order confirmation email system implemented for the Elixr juice delivery app.

## Overview

The email system sends detailed, professional confirmation emails to both customers and administrators for all successful orders and subscriptions. It features:

- **Dual Email System**: Sends separate emails to customers and admin
- **Order Type Detection**: Handles both regular orders and subscriptions differently
- **Professional HTML Design**: Modern, responsive email templates
- **Comprehensive Data**: Includes all order/subscription details
- **Error Handling**: Robust error management and logging
- **Mobile-Friendly**: Responsive email templates

## API Endpoint

**Endpoint**: `POST /api/send-order-email`

**Payload**:
```json
{
  "orderId": "12345-67890-abcdef",
  "userEmail": "customer@example.com", // Optional - will fetch from DB if not provided
  "orderDetails": {} // Legacy field - not used in new implementation
}
```

**Response**:
```json
{
  "success": true,
  "userEmailSent": true,
  "adminEmailSent": true,
  "errors": []
}
```

## Features

### 1. Customer Confirmation Email

**Subject**: `Order Confirmation - [ORDER_ID] ✅` or `Subscription Confirmation - [ORDER_ID] ✅`

**Features**:
- Professional branding with Elixr logo and colors
- Payment success confirmation
- Complete order/subscription details
- Subscription-specific information (duration, frequency, discounts)
- Itemized list with quantities and prices
- Delivery address information
- Contact information for support
- Mobile-responsive design

### 2. Admin Notification Email

**Subject**: `🚨 New Order Alert - [ORDER_ID] - ₹[AMOUNT]` or `🚨 New Subscription Alert - [ORDER_ID] - ₹[AMOUNT]`

**Features**:
- Alert-style design to grab attention
- Immediate action checklist
- Customer contact information
- Complete order processing details
- Subscription setup instructions (for subscriptions)
- Inventory requirements
- Expected delivery count (for subscriptions)

### 3. Order Data Fetching

The system automatically fetches complete order data from Supabase using the `orderId`, including:
- Order items and quantities
- Customer information
- Shipping address
- Subscription details (if applicable)
- Pricing and discount information

### 4. Email Templates

#### Customer Email Features:
- **Header**: Gradient background with Elixr branding
- **Success Message**: Green success banner
- **Order Details**: Clean, organized sections
- **Subscription Info**: Special highlighting for subscription details
- **Item List**: Professional table-style layout
- **Address Section**: Formatted delivery information
- **Contact Info**: Support contact details
- **Footer**: Professional branding

#### Admin Email Features:
- **Alert Header**: Red alert-style header
- **Action Items**: Immediate todo checklist
- **Customer Info**: Contact details for follow-up
- **Processing Details**: All information needed for fulfillment
- **Subscription Setup**: Special instructions for recurring deliveries

## Error Handling

The system includes comprehensive error handling:

1. **Database Errors**: Handles order not found scenarios
2. **Email Failures**: Continues processing even if one email fails
3. **Missing Data**: Graceful handling of missing customer information
4. **Partial Success**: Reports which emails were sent successfully

## Integration Points

### 1. Payment Webhook Integration

The payment webhook (`netlify/functions/payment-confirm.js`) calls this API after successful payment:

```javascript
const emailPayload = {
  orderId: order.id,
  userEmail: extractedEmail,
  orderDetails: {} // Legacy field
};

const emailRes = await fetch('/api/send-order-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(emailPayload),
});
```

### 2. Environment Variables Required

```env
# Gmail OAuth2 Configuration
GMAIL_USER=your-gmail@gmail.com
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token

# Admin Configuration
ADMIN_EMAIL=admin@elixr.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## Email Flow

1. **Trigger**: Payment webhook receives successful payment notification
2. **API Call**: Webhook calls `/api/send-order-email` with order ID
3. **Data Fetch**: API fetches complete order data from Supabase
4. **Email Generation**: System generates HTML emails for customer and admin
5. **Email Sending**: Sends emails using Gmail OAuth2
6. **Response**: Returns success status and any errors

## Testing

### Test Function

The API includes a test function that can be enabled for testing:

```typescript
// Uncomment for manual testing only
sendTestEmail();
```

### Manual Testing

You can test the email system by:

1. Creating a test order through the normal checkout flow
2. Triggering the payment webhook manually
3. Calling the API directly with a valid order ID

## Benefits

1. **Professional Communication**: Well-designed emails enhance brand image
2. **Complete Information**: Both parties get all necessary details
3. **Immediate Action**: Admin knows exactly what to do next
4. **Customer Confidence**: Professional confirmations build trust
5. **Error Resilience**: System continues working even with partial failures
6. **Subscription Support**: Handles complex subscription details
7. **Mobile Friendly**: Emails look great on all devices

## Maintenance

### Regular Tasks

1. **Monitor Error Logs**: Check for email sending failures
2. **Update Contact Info**: Keep support contact details current
3. **Template Updates**: Refresh email designs as needed
4. **Environment Variables**: Ensure all required variables are set

### Future Enhancements

1. **Email Templates**: Add more customization options
2. **Tracking Integration**: Include shipping tracking information
3. **Subscription Reminders**: Add renewal and delivery reminders
4. **A/B Testing**: Test different email designs
5. **Localization**: Add multi-language support

This robust email system ensures professional communication and smooth operations for the Elixr juice delivery service.

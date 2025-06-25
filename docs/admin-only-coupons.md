# Admin-Only Coupon System

## Overview
The admin-only coupon system allows administrators to create coupon codes that are hidden from regular users but can still be manually applied during checkout. This is perfect for customer support scenarios where you want to provide special discounts on a case-by-case basis.

## How It Works

### For Regular Users
- **Coupon Dropdown**: Users see only public coupons in the dropdown during checkout
- **Manual Entry**: Users can still manually enter admin-only coupon codes if they know them
- **Validation**: All coupon validation rules still apply (min order, usage limits, etc.)

### For Admin Users
- **Full Visibility**: Admins see all coupons (public + admin-only) in the dropdown during checkout
- **Admin Badge**: Admin-only coupons are marked with a red "ADMIN" badge
- **Management Panel**: Access all coupons via `/admin/coupons` page

## Admin-Only Coupons Available

### ADMIN500
- **Discount**: ₹500 off
- **Min Order**: ₹1,000
- **Usage**: 1 time per user
- **Valid For**: All orders

### SUPPORT25
- **Discount**: 25% off (max ₹300)
- **Min Order**: ₹200
- **Usage**: 1 time per user
- **Valid For**: All orders

### EMERGENCY100
- **Discount**: ₹100 off
- **Min Order**: ₹400
- **Usage**: 2 times per user
- **Valid For**: All orders

### VIP30
- **Discount**: 30% off (max ₹500)
- **Min Order**: ₹800
- **Usage**: 3 times per user
- **Valid For**: All orders

## Usage Instructions

### For Customer Support
1. Navigate to `/admin/coupons` to view all available codes
2. Use the search function to find appropriate coupons
3. Copy the coupon code using the "Copy Code" button
4. Share the code with customers via email, chat, or phone
5. Customers can manually enter the code during checkout

### For Management
1. **Adding New Admin-Only Coupons**: Edit `src/lib/coupons.ts` and add `adminOnly: true` to new coupons
2. **Monitoring Usage**: Use the analytics dashboard to track coupon performance
3. **Access Control**: Only users with admin emails can see admin-only coupons

## Technical Implementation

### Coupon Interface
```typescript
interface Coupon {
  code: string;
  discount: number;
  discountType: 'fixed' | 'percentage';
  description: string;
  adminOnly?: boolean;  // New property for admin-only coupons
  // ... other properties
}
```

### Filtering Logic
- **Public Users**: `COUPONS.filter(c => !c.adminOnly)`
- **Admin Users**: All coupons visible
- **Manual Entry**: All active coupons can be validated

## Security Notes
- Admin-only coupons are filtered client-side for UI display
- Server-side validation still applies all coupon rules
- Coupon codes should be treated as sensitive information
- Regular auditing of admin-only coupon usage is recommended

## Benefits
- ✅ Flexible customer support tool
- ✅ Case-by-case discount management
- ✅ Hidden from general public
- ✅ Full admin control and visibility
- ✅ Maintains all validation rules
- ✅ Easy to copy and share codes

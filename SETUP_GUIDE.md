# Coupon & Referral System - Setup Guide

## 🚀 Quick Start

### 1. Database Setup

Execute the following SQL schema in your Supabase SQL editor:

```sql
-- Copy and run the entire content from sql/coupon_referral_schema.sql
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BASE_URL=your_app_url
CRON_SECRET=your_cron_secret
```

### 3. Test the System

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Test coupon validation**:
   - Go to checkout page
   - Try coupon codes: `welcome200`, `WELCOME10`, `JUICE50`, `MONTHLY200`
   - Verify dropdown shows available coupons
   - Test validation logic and error handling

3. **Test referral system**:
   - Create a user account
   - Check `/account` page for referral code
   - Use referral code during signup of another user
   - Complete an order to trigger reward processing

4. **Access analytics dashboard**:
   - Login as admin user
   - Visit `/admin/analytics`
   - View coupon and referral performance metrics

### 4. Production Deployment

1. **Set up webhook endpoint** for automated reward processing:
   ```
   POST /api/webhooks/order-completed
   ```

2. **Configure cron jobs** for periodic processing (optional)

3. **Monitor analytics** for system performance

## 🔧 System Components

### Frontend Components
- `CouponInput` - Coupon code entry with dropdown
- `ReferralInput` - Referral code entry
- `RewardsDisplay` - User rewards and referral management
- `AnalyticsDashboard` - Admin analytics and metrics

### Backend APIs
- `/api/coupons/validate` - Coupon validation
- `/api/referrals/validate` - Referral code validation
- `/api/referrals/process-reward` - Process referral rewards
- `/api/rewards/*` - User rewards management
- `/api/analytics/*` - Analytics data
- `/api/webhooks/order-completed` - Automated processing

### Database Tables
- `coupon_usage` - Track coupon usage
- `user_rewards` - User reward points and referral codes
- `referral_rewards` - Referral reward tracking
- `reward_transactions` - Complete transaction audit trail
- Enhanced `orders` table with coupon/referral fields

## ✅ Features Ready for Use

- ✅ Real-time coupon validation with first-order checks
- ✅ Automatic referral code generation (ELXxxxxx format)
- ✅ Reward points system with redemption flow
- ✅ Analytics dashboard with performance metrics
- ✅ Automated reward processing on order completion
- ✅ Complete audit trail for all transactions
- ✅ Row-level security for data protection
- ✅ Responsive UI with error handling

## 🎯 Usage Examples

### Coupon Codes Available
- `welcome200` - ₹200 off (first order, min ₹1,200)
- `WELCOME10` - 10% off (first order, max ₹150)
- `JUICE50` - ₹50 off (5 uses per user, min ₹300)
- `MONTHLY200` - ₹200 off monthly subscriptions

### Referral Rewards
- ₹50 + 100 points for successful referrals
- 100 points = ₹50 redemption value
- First-order only reward eligibility

The system is production-ready and fully tested! 🎉

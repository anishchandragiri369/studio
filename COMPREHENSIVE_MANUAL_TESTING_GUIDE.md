# Comprehensive Manual Testing Guide
## Juice Delivery App - All Features Testing Checklist

**Version:** 1.0  
**Date:** July 2, 2025  
**Testing Environment:** Development/Staging/Production

---

## 🚀 Pre-Testing Setup

### Environment Preparation
- [ ] Database is set up with rating schema (`sql/rating_feedback_schema.sql`)
- [ ] Supabase configuration is active
- [ ] Payment gateway (Cashfree) is configured
- [ ] WhatsApp integration is set up
- [ ] Email service is configured
- [ ] App is running on correct port (9002)

### Test Data Requirements
- [ ] Test user accounts created
- [ ] Admin user account available
- [ ] Sample orders in different states
- [ ] Sample products/juices available
- [ ] Test payment methods set up

---

## 📱 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 User Registration
- [ ] **Basic Registration**
  - Navigate to `/signup`
  - Enter valid email, password, confirm password
  - Verify email validation
  - Check password strength requirements
  - Confirm successful registration

- [ ] **Google Sign-In**
  - Click "Sign in with Google" button
  - Complete OAuth flow
  - Verify user profile creation
  - Check automatic login

- [ ] **Email Verification**
  - Check email received for verification
  - Click verification link
  - Verify account activation

### 1.2 User Login
- [ ] **Email/Password Login**
  - Navigate to `/login`
  - Enter valid credentials
  - Test invalid credentials
  - Verify redirect to appropriate page

- [ ] **Remember Me Functionality**
  - Test persistent login
  - Check session duration

- [ ] **Google Login**
  - Test Google OAuth login
  - Verify profile information sync

### 1.3 Password Management
- [ ] **Forgot Password**
  - Navigate to `/forgot-password`
  - Enter registered email
  - Check password reset email
  - Complete password reset flow

- [ ] **Password Reset**
  - Navigate to `/reset-password`
  - Enter new password with reset token
  - Verify password requirements
  - Test login with new password

### 1.4 Profile Management
- [ ] **View Profile**
  - Navigate to `/account`
  - Verify all profile information displays
  - Check user statistics

- [ ] **Edit Profile**
  - Navigate to `/account/edit-profile`
  - Update name, email, phone
  - Upload profile photo
  - Verify changes saved
  - Check validation errors

---

## 🛒 2. PRODUCT CATALOG & BROWSING

### 2.1 Product Listing
- [ ] **Menu Page**
  - Navigate to `/menu`
  - Verify all products display
  - Check product images load
  - Test product search functionality
  - Verify price display

- [ ] **Categories**
  - Navigate to `/categories`
  - Test category filtering
  - Verify product count per category

- [ ] **Individual Product Pages**
  - Navigate to `/juices/[id]`
  - Check product details
  - Verify nutritional information
  - Test add to cart functionality

### 2.2 Search & Filtering
- [ ] **Product Search**
  - Search by product name
  - Search by ingredients
  - Test partial matches
  - Verify search results accuracy

- [ ] **Category Filtering**
  - Filter by juice type
  - Filter by health benefits
  - Test multiple filter combinations

---

## 🛍️ 3. SHOPPING CART & CHECKOUT

### 3.1 Cart Management
- [ ] **Add to Cart**
  - Add single items
  - Add multiple quantities
  - Add different products
  - Verify cart icon updates

- [ ] **Cart Page**
  - Navigate to `/cart`
  - Verify all items display
  - Test quantity updates
  - Test item removal
  - Check cart total calculation

- [ ] **Cart Persistence**
  - Add items, close browser
  - Reopen and verify cart contents
  - Test across different sessions

### 3.2 Checkout Process
- [ ] **Basic Checkout**
  - Navigate to `/checkout`
  - Fill delivery information
  - Select delivery date/time
  - Apply coupon codes
  - Verify order summary

- [ ] **Delivery Options**
  - Test different delivery windows
  - Verify delivery date validation
  - Check delivery fee calculation

- [ ] **Payment Integration**
  - Test Cashfree payment flow
  - Test different payment methods
  - Verify payment confirmation
  - Test payment failure scenarios

### 3.3 Order Completion
- [ ] **Order Success**
  - Navigate to `/order-success`
  - Verify order details display
  - Check confirmation email sent
  - Test order tracking link

- [ ] **Payment Failed**
  - Navigate to `/payment-failed`
  - Test retry payment option
  - Verify failed payment email

---

## 📦 4. ORDER MANAGEMENT

### 4.1 Order History
- [ ] **Orders Page**
  - Navigate to `/orders`
  - Verify all orders display
  - Check order status updates
  - Test order filtering
  - Verify guest order lookup

- [ ] **Order Details**
  - Click on individual orders
  - Verify complete order information
  - Check delivery tracking
  - Test reorder functionality

### 4.2 Order Status Tracking
- [ ] **Status Updates**
  - Verify status progression: Pending → Confirmed → Preparing → Out for Delivery → Delivered
  - Check real-time updates
  - Test email notifications

- [ ] **Delivery Tracking**
  - Check delivery partner information
  - Verify estimated delivery time
  - Test delivery updates

---

## 🔄 5. SUBSCRIPTION MANAGEMENT

### 5.1 Creating Subscriptions
- [ ] **Subscription Plans**
  - Navigate to `/subscriptions`
  - View available plans
  - Test plan selection
  - Verify pricing display

- [ ] **Subscription Checkout**
  - Navigate to `/subscriptions/subscribe`
  - Select subscription details
  - Choose delivery preferences
  - Complete payment flow

### 5.2 Managing Active Subscriptions
- [ ] **My Subscriptions**
  - Navigate to `/my-subscriptions`
  - Verify all subscriptions display
  - Check subscription status
  - Test subscription details

- [ ] **Delivery Preferences**
  - Navigate to `/subscriptions/delivery-preferences`
  - Update delivery days
  - Change delivery address
  - Modify delivery windows

- [ ] **Pause/Resume Subscriptions**
  - Test pause functionality
  - Verify pause duration options
  - Test resume subscription
  - Check billing adjustments

### 5.3 Subscription Analytics
- [ ] **Admin View**
  - Navigate to `/admin/subscriptions`
  - Verify subscription metrics
  - Test subscription reports
  - Check revenue analytics

---

## 🍎 6. FRUIT BOWLS FEATURE

### 6.1 Fruit Bowl Products
- [ ] **Fruit Bowls Page**
  - Navigate to `/fruit-bowls`
  - Verify product listings
  - Check customization options

- [ ] **Individual Fruit Bowl**
  - Navigate to `/fruit-bowls/[id]`
  - Test customization features
  - Verify pricing updates
  - Test add to cart

### 6.2 Fruit Bowl Subscriptions
- [ ] **Subscription Creation**
  - Navigate to `/subscribe/fruit-bowls`
  - Select fruit bowl plans
  - Configure delivery schedule
  - Complete subscription setup

---

## ⭐ 7. RATING & FEEDBACK SYSTEM (NEW)

### 7.1 Order Rating Flow
- [ ] **Rating Request**
  - Complete an order
  - Wait for delivery completion
  - Check rating request email/notification
  - Verify rating request API call

- [ ] **Submit Order Rating**
  - Navigate to rating form from email/account
  - Fill overall rating (1-5 stars)
  - Fill quality rating
  - Fill delivery rating
  - Fill service rating
  - Add feedback text
  - Toggle anonymous option
  - Submit rating

- [ ] **View Own Ratings**
  - Navigate to `/account`
  - Check "My Ratings" section
  - Verify submitted ratings display
  - Test edit rating functionality

### 7.2 Product-Specific Ratings
- [ ] **Individual Juice Ratings**
  - Rate specific juices from an order
  - Fill taste rating
  - Fill freshness rating
  - Add product feedback
  - Set recommendation status
  - Submit product rating

### 7.3 Public Reviews Display
- [ ] **Reviews Page**
  - Navigate to `/reviews`
  - Verify all public reviews display
  - Check rating filters (1-5 stars)
  - Test sorting options (newest, oldest, highest rated)
  - Verify anonymous reviews display properly

- [ ] **Review Helpfulness**
  - Test "helpful" voting on reviews
  - Verify vote count updates
  - Test removing helpful vote
  - Check helpful count sorting

### 7.4 Admin Rating Management
- [ ] **Rating Analytics**
  - Access admin panel
  - View rating statistics
  - Check average ratings
  - Monitor feedback trends

- [ ] **Response to Feedback**
  - Respond to customer feedback
  - Mark responses as public/private
  - Verify response notifications

### 7.5 Rating API Testing
- [ ] **Rating Submission API**
  - Test `/api/ratings/submit` endpoint
  - Verify validation rules
  - Test duplicate submission prevention

- [ ] **Rating List API**
  - Test `/api/ratings/list` endpoint
  - Verify filtering options
  - Test pagination

- [ ] **Rating Helpfulness API**
  - Test `/api/ratings/helpful` endpoint
  - Verify vote tracking
  - Test vote toggling

- [ ] **Rating Request API**
  - Test `/api/ratings/request` endpoint
  - Verify automated triggers
  - Check email notifications

---

## 🎫 8. COUPON & DISCOUNT SYSTEM

### 8.1 Coupon Application
- [ ] **Coupon Validation**
  - Apply valid coupon codes
  - Test expired coupons
  - Test usage limit coupons
  - Verify discount calculations

- [ ] **Referral Coupons**
  - Test referral code generation
  - Apply referral discounts
  - Verify referrer rewards

### 8.2 Admin Coupon Management
- [ ] **Create Coupons**
  - Navigate to `/admin/coupons`
  - Create percentage discounts
  - Create fixed amount discounts
  - Set usage limits and expiry

- [ ] **Coupon Analytics**
  - View coupon usage statistics
  - Check coupon performance
  - Monitor discount impact

---

## 👨‍👩‍👧‍👦 9. FAMILY GROUPS FEATURE

### 9.1 Family Group Creation
- [ ] **Create Family Group**
  - Set up family account
  - Add family members
  - Configure group settings

- [ ] **Join Family Group**
  - Test invitation process
  - Accept family group invitation
  - Verify group permissions

### 9.2 Family Group Management
- [ ] **Group Orders**
  - Place orders for family members
  - Test group billing
  - Verify delivery coordination

---

## 🎁 10. GIFT SUBSCRIPTIONS

### 10.1 Gift Purchase
- [ ] **Buy Gift Subscription**
  - Navigate to `/gift`
  - Select gift subscription plan
  - Enter recipient details
  - Complete gift purchase

### 10.2 Gift Redemption
- [ ] **Claim Gift**
  - Navigate to `/gift/claim`
  - Enter gift code
  - Set up recipient account
  - Activate gift subscription

---

## 🏢 11. CORPORATE FEATURES

### 11.1 Corporate Accounts
- [ ] **Corporate Registration**
  - Register corporate account
  - Set up billing details
  - Add employee access

- [ ] **Employee Management**
  - Add/remove employees
  - Set spending limits
  - Monitor employee orders

---

## 💰 12. REWARDS & LOYALTY SYSTEM

### 12.1 Earning Rewards
- [ ] **Order Rewards**
  - Complete orders
  - Verify points earned
  - Check reward balance

- [ ] **Referral Rewards**
  - Refer new customers
  - Verify referral bonuses
  - Track referral status

### 12.2 Redeeming Rewards
- [ ] **Reward Redemption**
  - Apply rewards during checkout
  - Test partial redemption
  - Verify balance updates

---

## 👑 13. ADMIN PANEL FEATURES

### 13.1 Dashboard & Analytics
- [ ] **Admin Dashboard**
  - Navigate to `/admin`
  - View key metrics
  - Check real-time data

- [ ] **Advanced Analytics**
  - Navigate to `/admin/analytics`
  - View sales reports
  - Check customer analytics
  - Monitor subscription metrics

### 13.2 Product Management
- [ ] **Add Products**
  - Navigate to `/admin/add-product`
  - Create new products
  - Upload product images
  - Set pricing and inventory

- [ ] **Inventory Management**
  - Navigate to `/admin/manage-stock`
  - Update stock levels
  - Set low stock alerts
  - Manage product availability

### 13.3 Order Management
- [ ] **Order Processing**
  - View pending orders
  - Update order status
  - Handle order modifications
  - Process refunds

### 13.4 Customer Support
- [ ] **Customer Communications**
  - Send order notifications
  - Handle customer inquiries
  - Manage customer feedback

---

## 📱 14. MOBILE APP FEATURES

### 14.1 Mobile Responsiveness
- [ ] **Mobile Web App**
  - Test on various screen sizes
  - Verify touch interactions
  - Check mobile navigation

- [ ] **PWA Features**
  - Test offline functionality
  - Verify push notifications
  - Check app installation

### 14.2 Native App (if available)
- [ ] **Android App**
  - Test APK installation
  - Verify all features work
  - Check performance

---

## 🔧 15. SYSTEM INTEGRATION TESTING

### 15.1 Email System
- [ ] **Order Emails**
  - Order confirmation emails
  - Delivery notification emails
  - Payment failure emails
  - Rating request emails

- [ ] **Marketing Emails**
  - Newsletter subscriptions
  - Promotional emails
  - Subscription reminders

### 15.2 WhatsApp Integration
- [ ] **WhatsApp Notifications**
  - Order confirmations via WhatsApp
  - Delivery updates
  - Customer support messages

### 15.3 Payment Gateway
- [ ] **Cashfree Integration**
  - Test various payment methods
  - Verify webhook handling
  - Test payment failures
  - Check refund processing

---

## 🔍 16. ERROR HANDLING & EDGE CASES

### 16.1 Network Issues
- [ ] **Offline Scenarios**
  - Test app behavior when offline
  - Verify data persistence
  - Check sync when back online

- [ ] **Slow Network**
  - Test on slow connections
  - Verify loading states
  - Check timeout handling

### 16.2 Invalid Data
- [ ] **Form Validation**
  - Submit forms with invalid data
  - Test required field validation
  - Verify error messages

- [ ] **API Error Handling**
  - Test API failures
  - Verify error responses
  - Check user feedback

### 16.3 Browser Compatibility
- [ ] **Cross-Browser Testing**
  - Test on Chrome, Firefox, Safari, Edge
  - Verify feature compatibility
  - Check responsive design

---

## 🚨 17. SECURITY TESTING

### 17.1 Authentication Security
- [ ] **Session Management**
  - Test session expiration
  - Verify logout functionality
  - Check unauthorized access

- [ ] **Data Protection**
  - Test SQL injection prevention
  - Verify XSS protection
  - Check CSRF protection

### 17.2 Payment Security
- [ ] **Payment Data**
  - Verify PCI compliance
  - Check payment data encryption
  - Test secure payment flow

---

## 📊 18. PERFORMANCE TESTING

### 18.1 Page Load Speed
- [ ] **Critical Pages**
  - Homepage load time
  - Product pages
  - Checkout flow
  - Admin dashboard

### 18.2 Database Performance
- [ ] **Query Performance**
  - Test with large datasets
  - Verify search performance
  - Check rating system queries

---

## 🔄 19. FEATURE COMBINATION TESTING

### 19.1 Complex User Journeys
- [ ] **Complete Customer Journey**
  1. Register account
  2. Browse products
  3. Add items to cart
  4. Apply coupon
  5. Complete checkout
  6. Track order
  7. Rate order
  8. Subscribe to newsletter
  9. Refer friend
  10. Redeem rewards

- [ ] **Subscription + Rating Flow**
  1. Create subscription
  2. Receive deliveries
  3. Rate multiple orders
  4. Pause subscription
  5. Resume subscription
  6. Modify preferences

- [ ] **Family + Corporate Features**
  1. Set up corporate account
  2. Create family groups
  3. Place group orders
  4. Track corporate spending
  5. Generate reports

### 19.2 Multi-Feature Scenarios
- [ ] **Gift + Subscription + Rating**
  - Purchase gift subscription
  - Recipient claims and uses
  - Rate gift subscription experience

- [ ] **Coupon + Reward + Referral**
  - Use coupon code
  - Earn reward points
  - Refer new customer
  - Combine all discounts

---

## ✅ 20. TESTING CHECKLIST COMPLETION

### Final Verification
- [ ] All core features tested
- [ ] All edge cases covered
- [ ] Security measures verified
- [ ] Performance acceptable
- [ ] Mobile compatibility confirmed
- [ ] Cross-browser functionality verified
- [ ] Integration points tested
- [ ] Error handling validated
- [ ] User experience optimized

### Documentation
- [ ] Test results documented
- [ ] Issues reported
- [ ] Feature gaps identified
- [ ] Performance metrics recorded
- [ ] Security assessment completed

---

## 📝 TESTING NOTES TEMPLATE

```
Feature: _____________________
Test Date: ___________________
Tester: _____________________

Test Steps:
1. 
2. 
3. 

Expected Result:
___________________________

Actual Result:
___________________________

Status: [ ] Pass [ ] Fail [ ] Needs Investigation

Issues Found:
___________________________

Notes:
___________________________
```

---

## 🚀 POST-TESTING ACTIONS

### If All Tests Pass
- [ ] Deploy to production
- [ ] Monitor system performance
- [ ] Set up ongoing monitoring
- [ ] Plan next testing cycle

### If Issues Found
- [ ] Document all issues
- [ ] Prioritize critical fixes
- [ ] Assign to development team
- [ ] Schedule fix verification
- [ ] Plan regression testing

---

**Note:** This comprehensive testing guide should be executed systematically. Start with authentication and core features, then move to advanced features and integrations. Always test feature combinations to ensure seamless user experience.

**Estimated Testing Time:** 2-3 days for complete manual testing of all features and combinations.

# Order Rating System Integration Guide

This guide explains how to properly implement the order rating system across your application.

## Key Components

1. **OrderRating Component**: Displays existing ratings or provides a way to submit new ratings
2. **RatingForm Component**: The form for submitting a new rating
3. **API Endpoints**: 
   - `/api/ratings/submit` - For submitting and retrieving individual ratings
   - `/api/ratings/batch` - For checking multiple orders' rating status at once

## Implementation in Different Pages

### Account Page

The account page shows a summary of recent orders with their ratings:

1. Fetch orders for the current user
2. Use the `batchCheckOrderRatings` helper to efficiently verify rating status
3. Display each order with its rating using the `OrderRating` component

### Orders Page

The orders page shows a complete order history:

1. Fetch all orders for the current user
2. Use the `batchCheckOrderRatings` helper to efficiently verify rating status
3. Display each order with its rating using the `OrderRating` component

## Rating Status Synchronization

To ensure rating status is consistent across pages:

1. Use the `rating_submitted` flag on each order object
2. The `OrderRating` component will check for existing ratings on mount
3. The batch API endpoint helps efficiently check multiple orders at once

## Row Level Security (RLS)

When using RLS with Supabase:

1. Apply the policies in `supabase_rls_policies.sql` or `simplified_rls_policies.sql`
2. Ensure the API routes use the service role for operations that need to bypass RLS
3. Make sure your front-end components correctly handle permissions

## Common Issues

1. **Order shows "Rate Order" even after rating**: 
   - Check if `rating_submitted` is properly set on the order object
   - Use the batch checking helper to verify rating status

2. **Rating submission fails with RLS error**:
   - Ensure the correct RLS policies are applied
   - Check that the API is using the service role key when needed

3. **Orders don't display when returning to the browser**:
   - This has been fixed with order caching implementation
   - Orders are now cached in localStorage and displayed immediately when returning
   - Fresh data is fetched in the background
   
4. **Unable to submit ratings from Orders page**:
   - The Orders page now has proper configuration to allow rating submission
   - `compact` parameter is set to `false` to show the full rating form
   - Ensure the OrderRating component gets the correct userId prop

5. **Reward points not showing after rating submission**:
   - Check if the `user_rewards` table exists in your database
   - Ensure the rating submission API is successfully awarding points
   - Verify the rewards API endpoints are working correctly
   - The RewardsDisplay component should refresh after rating submission

3. **Ratings don't appear on both pages**:
   - Make sure both pages are using the same data fetching logic
   - Use the batch checking helper on both pages

## Best Practices

1. Always update local state immediately after a successful rating submission
2. Use batch operations where possible for better performance
3. Keep the RLS policies consistent with your application's permission model
4. Utilize caching for better user experience when navigating between pages
5. Ensure rating components have consistent configuration across all pages

## Browser Return and Page Loading

To ensure orders are visible immediately when returning to the browser:

1. Orders are cached in localStorage with a 60-minute validity period
2. When returning to the page, cached orders are displayed immediately
3. Fresh data is fetched in the background and updates the UI when available
4. Rating status is checked for cached orders to ensure consistency

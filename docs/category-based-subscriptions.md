# Category-Based Subscriptions

## Overview

The category-based subscription feature allows users to select a specific juice category for their weekly or monthly subscriptions, rather than choosing individual juices. This provides a curated experience where users get variety within their preferred category.

## How It Works

### For Users

1. **Category Selection**: When subscribing to weekly or monthly juice plans, users can now choose from available categories:
   - Traditional Categories: Fruit Blast, Green Power, Exotic Flavors, Veggie Fusion
   - Health-Focused Categories: Immunity Booster, Skin Glow, Radiant Health, Energy Kick, Detoxify, Workout Fuel, Daily Wellness, Kids Friendly, Seasonal Specials

2. **Automatic Distribution**: When a category is selected, the system automatically:
   - Identifies all juices in that category
   - Distributes them across the subscription period (7 days for weekly, 20 days for monthly)
   - Ensures variety by spacing out deliveries of the same juice

3. **Customized Option**: Users can still choose "Customized Selection" to pick individual juices from the complete collection.

### For Developers

#### Key Components

1. **CategoryBasedSubscription Component** (`src/components/subscriptions/CategoryBasedSubscription.tsx`)
   - Handles category selection UI
   - Shows distribution preview
   - Validates category availability

2. **Category Subscription Helper** (`src/lib/categorySubscriptionHelper.ts`)
   - `calculateCategoryDistribution()`: Calculates juice distribution across subscription period
   - `getAvailableCategories()`: Gets all categories with available juices
   - `validateCategoryForSubscription()`: Validates if a category has enough juices
   - `convertDistributionToSelections()`: Converts distribution to subscription format

#### Integration Points

1. **Subscription Page** (`src/app/subscriptions/subscribe/page.tsx`)
   - Added category selection before juice customization
   - Only shows juice customization when no category is selected
   - Handles category-based selections in checkout

2. **Subscription Plans** (`src/lib/constants.ts`)
   - Existing plans support category-based selection
   - No changes needed to plan structure

## Technical Implementation

### Distribution Algorithm

The system distributes juices across the subscription period using the following logic:

1. **Weekly Subscriptions (7 days)**:
   - Distributes juices across 7 days
   - Ensures variety by spacing out same juice types

2. **Monthly Subscriptions (20 days)**:
   - Distributes juices across 20 days
   - Provides more variety and longer-term planning

### Category Matching

Juices are matched to categories using:
- `juice.category` field for traditional categories
- `juice.tags` array for health-focused categories

### Validation

The system validates categories by:
- Checking if category has any juices
- Ensuring minimum variety (recommends at least 3 different juices)
- Validating against plan limits

## User Experience

### Category Selection Flow

1. User selects a subscription plan (weekly/monthly juice)
2. User sees category selection dropdown with:
   - Available categories with juice counts
   - "Customized Selection" option
3. If category is selected:
   - Shows category description and validation
   - Displays distribution preview
   - Hides individual juice selection
4. If "Customized" is selected:
   - Shows individual juice selection interface
   - Allows manual juice selection

### Distribution Preview

When a category is selected, users see:
- List of juices in the category
- Quantity of each juice
- Days when each juice will be delivered
- Total juices for the subscription period

## Benefits

1. **Simplified Selection**: Users don't need to choose individual juices
2. **Guaranteed Variety**: System ensures variety within the chosen category
3. **Health-Focused**: Easy selection of health-specific categories
4. **Flexibility**: Still allows customized selection when needed
5. **Better Distribution**: Intelligent distribution across subscription period

## Future Enhancements

1. **AI Recommendations**: Suggest categories based on user preferences
2. **Category Combinations**: Allow mixing juices from multiple categories
3. **Seasonal Categories**: Dynamic categories based on seasonal availability
4. **Personalized Distribution**: Customize distribution based on user preferences
5. **Category Analytics**: Track which categories are most popular

## Testing

To test the feature:

1. Navigate to `/subscriptions/subscribe?plan=weekly-juice`
2. Select different categories from the dropdown
3. Verify distribution preview shows correct juices and quantities
4. Test switching between category and customized selection
5. Verify checkout process works with category-based selections

## Database Considerations

The feature works with existing juice data structure:
- No database changes required
- Uses existing `category` and `tags` fields
- Compatible with current subscription system 
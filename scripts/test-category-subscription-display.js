/**
 * Test script to simulate category-based subscription display
 * This script creates a mock order with category-based subscription data
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mock order data with category-based subscription
const mockCategoryBasedOrder = {
  id: "test-category-order-123",
  order_type: "subscription",
  subscription_info: {
    subscriptionItems: [
      {
        id: "subscription-weekly-category-123",
        name: "Weekly Juice Plan",
        type: "subscription",
        price: 699,
        subscriptionData: {
          planId: "weekly-juice",
          planName: "Weekly Juice Plan",
          basePrice: 699,
          planFrequency: "weekly",
          selectedCategory: "Fruit Blast",
          selectedJuices: [], // Empty for category-based
          selectedFruitBowls: [],
          subscriptionDuration: 2,
          categoryDistribution: [
            { day: 1, juiceName: "Rejoice" },
            { day: 2, juiceName: "Berry Bliss" },
            { day: 3, juiceName: "Citrus Zing" },
            { day: 4, juiceName: "Rejoice" },
            { day: 5, juiceName: "Berry Bliss" },
            { day: 6, juiceName: "Citrus Zing" }
          ]
        }
      }
    ],
    hasSubscriptionItems: true
  }
};

// Mock order data with customized subscription
const mockCustomizedOrder = {
  id: "test-customized-order-456",
  order_type: "subscription",
  subscription_info: {
    subscriptionItems: [
      {
        id: "subscription-weekly-customized-456",
        name: "Weekly Customized Plan",
        type: "subscription",
        price: 1299,
        subscriptionData: {
          planId: "weekly-customized",
          planName: "Weekly Customized Plan",
          basePrice: 1299,
          planFrequency: "weekly",
          selectedCategory: null, // No category for customized
          selectedJuices: [
            { juiceId: "1", quantity: 2, pricePerItem: 120 },
            { juiceId: "2", quantity: 2, pricePerItem: 120 },
            { juiceId: "3", quantity: 1, pricePerItem: 120 },
            { juiceId: "6", quantity: 1, pricePerItem: 120 }
          ],
          selectedFruitBowls: [
            { fruitBowlId: "00203645-0096-41f2-a9f5-13c2d55bef7c", quantity: 2, pricePerItem: 300 }
          ],
          subscriptionDuration: 1
        }
      }
    ],
    hasSubscriptionItems: true
  }
};

// Mock order data with old flat structure
const mockOldStructureOrder = {
  id: "test-old-structure-order-789",
  order_type: "subscription",
  subscription_info: {
    planName: "Weekly Standard Plan",
    planFrequency: "weekly",
    subscriptionDuration: 1,
    basePrice: 699,
    selectedCategory: null,
    selectedJuices: [],
    selectedFruitBowls: []
  }
};

// Test the normalization function
function normalizeSubscriptionData(subscriptionInfo) {
  if (!subscriptionInfo) return null;

  // Check if it's the new nested structure with subscriptionItems
  if (subscriptionInfo.subscriptionItems && Array.isArray(subscriptionInfo.subscriptionItems)) {
    // Extract data from the first subscription item (assuming single subscription per order for now)
    const firstItem = subscriptionInfo.subscriptionItems[0];
    const subData = firstItem?.subscriptionData || {};
    
    return {
      planName: subData.planName || firstItem?.name || 'Subscription Plan',
      planFrequency: subData.planFrequency || 'weekly',
      subscriptionDuration: subData.subscriptionDuration || 1,
      basePrice: subData.basePrice || firstItem?.price || 0,
      selectedCategory: subData.selectedCategory || null,
      selectedJuices: subData.selectedJuices || [],
      selectedFruitBowls: subData.selectedFruitBowls || [],
      categoryDistribution: subData.categoryDistribution || null,
      deliverySchedule: subscriptionInfo.deliverySchedule || null
    };
  }

  // Check if it's the old flat structure
  if (subscriptionInfo.planName || subscriptionInfo.planFrequency) {
    return {
      planName: subscriptionInfo.planName || 'Subscription Plan',
      planFrequency: subscriptionInfo.planFrequency || 'weekly',
      subscriptionDuration: subscriptionInfo.subscriptionDuration || 1,
      basePrice: subscriptionInfo.basePrice || 0,
      selectedCategory: subscriptionInfo.selectedCategory || null,
      selectedJuices: subscriptionInfo.selectedJuices || [],
      selectedFruitBowls: subscriptionInfo.selectedFruitBowls || [],
      categoryDistribution: subscriptionInfo.categoryDistribution || null,
      deliverySchedule: subscriptionInfo.deliverySchedule || null
    };
  }

  // If it's neither, return null
  return null;
}

async function testSubscriptionDisplay() {
  console.log('🧪 Testing Subscription Details Display\n');

  // Test 1: Category-based subscription
  console.log('📋 Test 1: Category-Based Subscription');
  const categoryNormalized = normalizeSubscriptionData(mockCategoryBasedOrder.subscription_info);
  console.log('Normalized data:', JSON.stringify(categoryNormalized, null, 2));
  console.log('Is category-based:', categoryNormalized.selectedCategory && categoryNormalized.selectedCategory !== 'custom');
  console.log('Category:', categoryNormalized.selectedCategory);
  console.log('Has category distribution:', !!categoryNormalized.categoryDistribution);
  console.log('');

  // Test 2: Customized subscription
  console.log('📋 Test 2: Customized Subscription');
  const customizedNormalized = normalizeSubscriptionData(mockCustomizedOrder.subscription_info);
  console.log('Normalized data:', JSON.stringify(customizedNormalized, null, 2));
  console.log('Is customized:', !customizedNormalized.selectedCategory && customizedNormalized.selectedJuices.length > 0);
  console.log('Selected juices count:', customizedNormalized.selectedJuices.length);
  console.log('Selected fruit bowls count:', customizedNormalized.selectedFruitBowls.length);
  console.log('');

  // Test 3: Old structure subscription
  console.log('📋 Test 3: Old Structure Subscription');
  const oldNormalized = normalizeSubscriptionData(mockOldStructureOrder.subscription_info);
  console.log('Normalized data:', JSON.stringify(oldNormalized, null, 2));
  console.log('Is standard plan:', !oldNormalized.selectedCategory && oldNormalized.selectedJuices.length === 0);
  console.log('');

  // Test 4: Check actual orders in database
  console.log('📋 Test 4: Real Database Orders');
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, subscription_info')
    .eq('order_type', 'subscription')
    .not('subscription_info', 'is', null)
    .limit(3);

  if (error) {
    console.error('❌ Error fetching orders:', error);
  } else {
    console.log(`Found ${orders.length} orders to test`);
    
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1} (${order.id}):`);
      const normalized = normalizeSubscriptionData(order.subscription_info);
      if (normalized) {
        console.log(`  Plan: ${normalized.planName}`);
        console.log(`  Frequency: ${normalized.planFrequency}`);
        console.log(`  Category: ${normalized.selectedCategory || 'None'}`);
        console.log(`  Juices: ${normalized.selectedJuices.length}`);
        console.log(`  Fruit Bowls: ${normalized.selectedFruitBowls.length}`);
        console.log(`  Type: ${normalized.selectedCategory ? 'Category-Based' : normalized.selectedJuices.length > 0 ? 'Customized' : 'Standard'}`);
      } else {
        console.log('  ❌ Could not normalize subscription data');
      }
    });
  }

  console.log('\n✅ Test completed');
}

// Run the test
testSubscriptionDisplay().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 
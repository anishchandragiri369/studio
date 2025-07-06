/**
 * Debug script to check order data structure in database
 * This script helps identify how subscription data is being stored
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

async function debugOrderStructure() {
  console.log('🔍 Debugging Order Data Structure\n');

  try {
    // Fetch recent subscription orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'subscription')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }

    console.log(`📊 Found ${orders.length} subscription orders\n`);

    orders.forEach((order, index) => {
      console.log(`\n--- Order ${index + 1} ---`);
      console.log(`Order ID: ${order.id}`);
      console.log(`Created: ${order.created_at}`);
      console.log(`Status: ${order.status}`);
      console.log(`Total Amount: ${order.total_amount}`);
      
      console.log('\n📦 Subscription Info Structure:');
      if (order.subscription_info) {
        console.log('✅ Has subscription_info');
        console.log('Structure:', JSON.stringify(order.subscription_info, null, 2));
        
        // Check for different data structures
        if (order.subscription_info.subscriptionItems) {
          console.log('\n🔍 Found subscriptionItems structure');
          const items = order.subscription_info.subscriptionItems;
          items.forEach((item, idx) => {
            console.log(`\n  Item ${idx + 1}:`);
            console.log(`    Name: ${item.name}`);
            console.log(`    Type: ${item.type}`);
            console.log(`    Price: ${item.price}`);
            if (item.subscriptionData) {
              console.log(`    Has subscriptionData: ✅`);
              console.log(`    Plan Name: ${item.subscriptionData.planName}`);
              console.log(`    Plan Frequency: ${item.subscriptionData.planFrequency}`);
              console.log(`    Selected Category: ${item.subscriptionData.selectedCategory || 'None'}`);
              console.log(`    Selected Juices: ${item.subscriptionData.selectedJuices?.length || 0}`);
              console.log(`    Selected Fruit Bowls: ${item.subscriptionData.selectedFruitBowls?.length || 0}`);
            } else {
              console.log(`    Has subscriptionData: ❌`);
            }
          });
        } else {
          console.log('\n🔍 Flat structure (no subscriptionItems)');
          console.log(`Plan Name: ${order.subscription_info.planName || 'Not set'}`);
          console.log(`Plan Frequency: ${order.subscription_info.planFrequency || 'Not set'}`);
          console.log(`Selected Category: ${order.subscription_info.selectedCategory || 'Not set'}`);
          console.log(`Selected Juices: ${order.subscription_info.selectedJuices?.length || 0}`);
        }
      } else {
        console.log('❌ No subscription_info found');
      }
      
      console.log('\n📋 Order Items:');
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item, idx) => {
          console.log(`  Item ${idx + 1}: ${item.name} (${item.type}) - ₹${item.price}`);
        });
      } else {
        console.log('  No items array found');
      }
    });

    // Check for any orders with category-based subscriptions
    console.log('\n\n🔍 Checking for Category-Based Subscriptions...');
    const { data: categoryOrders, error: categoryError } = await supabase
      .from('orders')
      .select('id, subscription_info')
      .eq('order_type', 'subscription')
      .not('subscription_info', 'is', null);

    if (!categoryError && categoryOrders) {
      const hasCategory = categoryOrders.filter(order => {
        const info = order.subscription_info;
        return info.selectedCategory || 
               (info.subscriptionItems && info.subscriptionItems.some(item => 
                 item.subscriptionData?.selectedCategory
               ));
      });
      
      console.log(`Found ${hasCategory.length} orders with category-based subscriptions`);
      
      if (hasCategory.length > 0) {
        console.log('\nCategory-based orders:');
        hasCategory.forEach(order => {
          const info = order.subscription_info;
          const category = info.selectedCategory || 
                          info.subscriptionItems?.find(item => item.subscriptionData?.selectedCategory)?.subscriptionData?.selectedCategory;
          console.log(`  Order ${order.id}: ${category}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

// Run the debug function
debugOrderStructure().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 
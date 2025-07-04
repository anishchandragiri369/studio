#!/usr/bin/env node

/**
 * Test script to reproduce the "weekly-customized" subscription bug
 * 
 * This script tests:
 * 1. Order creation with weekly-customized plan  
 * 2. Webhook payment confirmation
 * 3. Subscription creation in user_subscriptions table
 * 
 * Expected: Orders should create corresponding subscriptions in user_subscriptions
 * Actual Bug: weekly-customized orders create orders but not subscriptions
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWeeklyCustomizedBug() {
  console.log('🔍 Testing Weekly Customized Subscription Bug\n');
  
  try {
    // 1. Check existing weekly-customized orders without subscriptions
    console.log('1️⃣ Checking existing weekly-customized orders...');
    
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .ilike('items', '%weekly-customized%')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message);
      return;
    }
    
    console.log(`📦 Found ${orders.length} weekly-customized orders:`);
    
    for (const order of orders) {
      console.log(`\n   Order ID: ${order.id}`);
      console.log(`   User ID: ${order.user_id}`);
      console.log(`   Order Type: ${order.order_type}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      
      // Check if subscription exists for this order
      if (order.user_id) {
        const { data: subscriptions, error: subError } = await supabase
          .from('user_subscriptions')
          .select('id, plan_id, status, created_at')
          .eq('user_id', order.user_id)
          .gte('created_at', order.created_at)
          .lte('created_at', new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString());
        
        if (subError) {
          console.log(`   ⚠️  Error checking subscriptions: ${subError.message}`);
        } else if (subscriptions.length === 0) {
          console.log(`   ❌ NO SUBSCRIPTION FOUND - This is the bug!`);
        } else {
          console.log(`   ✅ Subscription found: ${subscriptions[0].id} (${subscriptions[0].plan_id})`);
        }
      }
    }
    
    // 2. Test the subscription creation logic with order data
    console.log('\n2️⃣ Testing subscription creation logic...');
    
    if (orders.length > 0) {
      const testOrder = orders[0];
      console.log(`\n📋 Testing with Order ID: ${testOrder.id}`);
      
      // Extract subscription data from order items
      let subscriptionData = null;
      if (testOrder.items && Array.isArray(testOrder.items)) {
        const subscriptionItem = testOrder.items.find(item => 
          item.type === 'subscription' || 
          (item.name && item.name.toLowerCase().includes('customized'))
        );
        
        if (subscriptionItem) {
          console.log('📦 Found subscription item in order:');
          console.log(`   Name: ${subscriptionItem.name}`);
          console.log(`   Price: ₹${subscriptionItem.price}`);
          
          if (subscriptionItem.subscriptionData) {
            subscriptionData = subscriptionItem.subscriptionData;
            console.log('✅ Found subscriptionData:', {
              planId: subscriptionData.planId,
              planName: subscriptionData.planName,
              planFrequency: subscriptionData.planFrequency,
              subscriptionDuration: subscriptionData.subscriptionDuration
            });
          } else {
            console.log('❌ Missing subscriptionData in item - this could be the issue!');
          }
        } else {
          console.log('❌ No subscription item found in order items');
        }
      }
      
      // 3. Check webhook logic requirements
      console.log('\n3️⃣ Analyzing webhook subscription creation requirements...');
      
      const hasSubscriptionInfo = !!(testOrder.subscription_info || subscriptionData);
      const hasUserId = !!testOrder.user_id;
      const isSubscriptionOrder = testOrder.order_type === 'subscription' || testOrder.order_type === 'mixed';
      
      console.log(`   Order Type: ${testOrder.order_type} ${isSubscriptionOrder ? '✅' : '❌'}`);
      console.log(`   Has User ID: ${hasUserId ? '✅' : '❌'}`);
      console.log(`   Has Subscription Info: ${hasSubscriptionInfo ? '✅' : '❌'}`);
      
      if (isSubscriptionOrder && hasUserId && !hasSubscriptionInfo) {
        console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
        console.log('   - Order is marked as subscription type ✅');
        console.log('   - User ID exists ✅'); 
        console.log('   - But subscription_info is missing ❌');
        console.log('   - Webhook will skip subscription creation due to missing data');
      }
    }
    
    // 4. Check for payment-confirmed orders missing subscriptions
    console.log('\n4️⃣ Checking payment-confirmed orders without subscriptions...');
    
    const { data: confirmedOrders, error: confirmedError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'payment_confirmed')
      .in('order_type', ['subscription', 'mixed'])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (confirmedError) {
      console.error('❌ Error fetching confirmed orders:', confirmedError.message);
    } else {
      console.log(`\n💳 Found ${confirmedOrders.length} payment-confirmed subscription orders`);
      
      let orphanedOrders = 0;
      for (const order of confirmedOrders) {
        if (order.user_id) {
          const { data: subs, error: subErr } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('user_id', order.user_id)
            .gte('created_at', order.created_at)
            .lte('created_at', new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString());
          
          if (!subErr && subs.length === 0) {
            orphanedOrders++;
            console.log(`   ❌ Order ${order.id} (${order.order_type}) - NO SUBSCRIPTION`);
          }
        }
      }
      
      if (orphanedOrders > 0) {
        console.log(`\n🚨 Found ${orphanedOrders} paid orders WITHOUT subscriptions!`);
        console.log('   This confirms the bug: webhook fails to create subscriptions');
      } else {
        console.log('   ✅ All confirmed orders have corresponding subscriptions');
      }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('==================================================');
    console.log('BUG: Payment webhook fails to create subscriptions');
    console.log('CAUSE: Missing subscription data in webhook logic');
    console.log('IMPACT: Users pay but subscriptions are not created');
    console.log('FIX: Update webhook to extract and pass subscription data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWeeklyCustomizedBug().catch(console.error);

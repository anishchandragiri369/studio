const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderCreationSubscription() {
  console.log('🧪 Testing Order Creation vs Subscription Creation');
  console.log('==================================================\n');

  try {
    // Step 1: Get current subscription count
    console.log('1️⃣ Getting current subscription count...');
    const { data: currentSubscriptions, error: countError } = await supabase
      .from('user_subscriptions')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (countError) {
      console.error('❌ Error fetching current subscriptions:', countError);
      return;
    }

    console.log(`Current subscriptions in database: ${currentSubscriptions?.length || 0}`);
    if (currentSubscriptions && currentSubscriptions.length > 0) {
      console.log('Latest subscription created at:', currentSubscriptions[0].created_at);
    }

    // Step 2: Check recent orders with subscription data
    console.log('\n2️⃣ Checking recent subscription orders...');
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, order_type, status, created_at, subscription_info')
      .in('order_type', ['subscription', 'mixed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    console.log(`Found ${recentOrders?.length || 0} recent subscription orders`);
    
    if (recentOrders && recentOrders.length > 0) {
      console.log('\nRecent Orders:');
      recentOrders.forEach((order, index) => {
        console.log(`\nOrder ${index + 1}:`);
        console.log(`- ID: ${order.id}`);
        console.log(`- Type: ${order.order_type}`);
        console.log(`- Status: ${order.status}`);
        console.log(`- User ID: ${order.user_id}`);
        console.log(`- Created: ${order.created_at}`);
        console.log(`- Has subscription_info: ${!!order.subscription_info}`);
      });

      // Step 3: Check if subscriptions exist for these orders
      console.log('\n3️⃣ Checking if subscriptions exist for these orders...');
      const userIds = recentOrders.map(order => order.user_id);
      const { data: userSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('id, user_id, plan_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (subsError) {
        console.error('❌ Error fetching user subscriptions:', subsError);
        return;
      }

      console.log(`Found ${userSubscriptions?.length || 0} subscriptions for these users`);

      // Step 4: Analyze the relationship
      console.log('\n4️⃣ Analyzing Order vs Subscription Relationship:');
      console.log('='.repeat(60));

      recentOrders.forEach((order, index) => {
        console.log(`\n📦 Order ${index + 1} Analysis:`);
        console.log(`Order ID: ${order.id}`);
        console.log(`Order Status: ${order.status}`);
        console.log(`Order Created: ${order.created_at}`);
        
        // Find subscriptions for this user
        const userSubs = userSubscriptions?.filter(sub => sub.user_id === order.user_id) || [];
        console.log(`User Subscriptions: ${userSubs.length}`);
        
        if (userSubs.length > 0) {
          userSubs.forEach((sub, subIndex) => {
            console.log(`  Subscription ${subIndex + 1}:`);
            console.log(`    - ID: ${sub.id}`);
            console.log(`    - Plan ID: ${sub.plan_id}`);
            console.log(`    - Created: ${sub.created_at}`);
            
            // Check timing
            const orderTime = new Date(order.created_at);
            const subTime = new Date(sub.created_at);
            const timeDiff = Math.abs(subTime - orderTime) / 1000; // seconds
            
            console.log(`    - Time difference: ${timeDiff.toFixed(2)} seconds`);
            
            if (timeDiff < 5) {
              console.log(`    ⚠️  SUSPICIOUS: Subscription created very close to order time!`);
            } else if (order.status === 'payment_pending' && subTime > orderTime) {
              console.log(`    ❌ VIOLATION: Subscription created for pending payment order!`);
            } else if (order.status === 'Payment Success' && subTime > orderTime) {
              console.log(`    ✅ CORRECT: Subscription created after successful payment`);
            } else {
              console.log(`    ℹ️  INFO: Subscription timing analysis`);
            }
          });
        } else {
          if (order.status === 'payment_pending') {
            console.log(`  ✅ CORRECT: No subscription for pending payment order`);
          } else if (order.status === 'Payment Success') {
            console.log(`  ⚠️  ISSUE: No subscription found for successful payment order`);
          } else {
            console.log(`  ℹ️  INFO: No subscriptions found for this user`);
          }
        }
      });

      // Step 5: Summary
      console.log('\n5️⃣ Summary:');
      console.log('='.repeat(60));
      
      const pendingOrders = recentOrders.filter(order => order.status === 'payment_pending');
      const successOrders = recentOrders.filter(order => order.status === 'Payment Success');
      const otherOrders = recentOrders.filter(order => 
        order.status !== 'payment_pending' && order.status !== 'Payment Success'
      );

      console.log(`📊 Order Status Breakdown:`);
      console.log(`- Pending Payment: ${pendingOrders.length}`);
      console.log(`- Payment Success: ${successOrders.length}`);
      console.log(`- Other Status: ${otherOrders.length}`);

      // Check for violations
      let violations = 0;
      pendingOrders.forEach(order => {
        const userSubs = userSubscriptions?.filter(sub => sub.user_id === order.user_id) || [];
        const recentSubs = userSubs.filter(sub => {
          const orderTime = new Date(order.created_at);
          const subTime = new Date(sub.created_at);
          return subTime >= orderTime;
        });
        if (recentSubs.length > 0) {
          violations++;
          console.log(`❌ VIOLATION: Order ${order.id} (pending) has ${recentSubs.length} subscription(s) created after order`);
        }
      });

      if (violations === 0) {
        console.log(`✅ SUCCESS: No payment-first rule violations found!`);
        console.log(`   All pending orders correctly have no subscriptions.`);
      } else {
        console.log(`❌ FAILURE: Found ${violations} payment-first rule violations!`);
      }

    } else {
      console.log('No recent subscription orders found to test.');
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testOrderCreationSubscription().then(() => {
  console.log('\n🔍 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 
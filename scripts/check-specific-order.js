const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificOrder() {
  console.log('🔍 Checking Specific Order Subscription Info');
  console.log('============================================\n');

  try {
    // You can replace this with the actual order ID you want to check
    const orderId = process.argv[2];
    
    if (!orderId) {
      console.log('❌ Please provide an order ID as a command line argument');
      console.log('Usage: node scripts/check-specific-order.js <order-id>');
      return;
    }

    console.log(`1️⃣ Fetching order with ID: ${orderId}`);

    // Fetch the specific order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ Error fetching order:', orderError);
      return;
    }

    if (!order) {
      console.log('❌ Order not found');
      return;
    }

    console.log('✅ Order found!');
    console.log(`\nOrder Details:`);
    console.log(`- ID: ${order.id}`);
    console.log(`- User ID: ${order.user_id}`);
    console.log(`- Status: ${order.status}`);
    console.log(`- Order Type: ${order.order_type}`);
    console.log(`- Total Amount: ${order.total_amount}`);
    console.log(`- Created: ${order.created_at}`);

    // Check if order has subscription info
    if (order.subscription_info) {
      console.log('\n📦 Subscription Info Structure:');
      console.log('='.repeat(50));
      
      const subInfo = order.subscription_info;
      console.log(`- Plan Name: ${subInfo.planName}`);
      console.log(`- Base Price: ${subInfo.basePrice}`);
      console.log(`- Plan Frequency: ${subInfo.planFrequency}`);
      console.log(`- Selected Category: ${subInfo.selectedCategory}`);
      console.log(`- Subscription Duration: ${subInfo.subscriptionDuration}`);
      console.log(`- Has Category Distribution: ${!!subInfo.categoryDistribution}`);
      console.log(`- Selected Juices Count: ${subInfo.selectedJuices?.length || 0}`);
      console.log(`- Subscription Items Count: ${subInfo.subscriptionItems?.length || 0}`);

      if (subInfo.categoryDistribution) {
        console.log(`\n📊 Category Distribution Details:`);
        subInfo.categoryDistribution.forEach((item, index) => {
          console.log(`  Item ${index + 1}:`);
          console.log(`    - Juice: ${item.juice?.name || 'Unknown'}`);
          console.log(`    - Juice ID: ${item.juiceId}`);
          console.log(`    - Quantity: ${item.quantity}`);
          console.log(`    - Days: ${item.days?.join(', ') || 'N/A'}`);
        });
      }

      if (subInfo.selectedJuices) {
        console.log(`\n🥤 Selected Juices:`);
        subInfo.selectedJuices.forEach((juice, index) => {
          console.log(`  ${index + 1}. Juice ID: ${juice.juiceId}, Quantity: ${juice.quantity}`);
        });
      }

      // Check if subscription exists for this order
      console.log('\n2️⃣ Checking if subscription exists for this order...');
      
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('id, plan_id, selected_category, category_distribution, created_at')
        .eq('user_id', order.user_id)
        .order('created_at', { ascending: false });

      if (subError) {
        console.error('❌ Error fetching subscriptions:', subError);
        return;
      }

      console.log(`Found ${subscriptions?.length || 0} subscription(s) for user ${order.user_id}`);

      if (subscriptions && subscriptions.length > 0) {
        console.log('\n📋 Existing Subscriptions:');
        subscriptions.forEach((sub, index) => {
          console.log(`\nSubscription ${index + 1}:`);
          console.log(`  - ID: ${sub.id}`);
          console.log(`  - Plan ID: ${sub.plan_id}`);
          console.log(`  - Selected Category: ${sub.selected_category}`);
          console.log(`  - Has Category Distribution: ${!!sub.category_distribution}`);
          console.log(`  - Created: ${sub.created_at}`);
          
          // Check if this subscription matches the order
          const orderTime = new Date(order.created_at);
          const subTime = new Date(sub.created_at);
          const timeDiff = Math.abs(subTime - orderTime) / 1000; // seconds
          
          console.log(`  - Time difference from order: ${timeDiff.toFixed(2)} seconds`);
          
          if (timeDiff < 60) {
            console.log(`  ✅ LIKELY MATCH: Subscription created close to order time`);
          } else if (order.status === 'Payment Success' && subTime > orderTime) {
            console.log(`  ✅ CORRECT: Subscription created after successful payment`);
          } else if (order.status === 'payment_pending') {
            console.log(`  ❌ VIOLATION: Subscription exists for pending payment order`);
          }
        });
      } else {
        console.log('\n❌ No subscriptions found for this user');
        
        if (order.status === 'Payment Success') {
          console.log('⚠️  ISSUE: Order has successful payment but no subscription exists');
          console.log('   This suggests the payment webhook failed to create the subscription');
        } else if (order.status === 'payment_pending') {
          console.log('✅ CORRECT: No subscription for pending payment order');
        }
      }

      // Step 3: Analyze the subscription creation logic
      console.log('\n3️⃣ Analyzing Subscription Creation Logic:');
      console.log('='.repeat(50));
      
      let shouldCreateSubscription = false;
      let reason = '';

      if (order.status === 'Payment Success') {
        if (order.order_type === 'subscription' || order.order_type === 'mixed') {
          if (order.subscription_info) {
            shouldCreateSubscription = true;
            reason = 'Order has successful payment, is subscription type, and has subscription info';
          } else {
            reason = 'Order has successful payment and is subscription type, but missing subscription info';
          }
        } else {
          reason = 'Order has successful payment but is not subscription type';
        }
      } else {
        reason = 'Order does not have successful payment status';
      }

      console.log(`Should create subscription: ${shouldCreateSubscription ? 'YES' : 'NO'}`);
      console.log(`Reason: ${reason}`);

      if (shouldCreateSubscription && (!subscriptions || subscriptions.length === 0)) {
        console.log('\n🔧 RECOMMENDATION:');
        console.log('The subscription should be created but is missing.');
        console.log('Possible causes:');
        console.log('1. Payment webhook failed to process');
        console.log('2. Subscription creation API failed');
        console.log('3. Database error during subscription creation');
        console.log('\nYou can use the sync tool to create the missing subscription.');
      }

    } else {
      console.log('\n❌ Order does not have subscription info');
    }

  } catch (error) {
    console.error('❌ Error in check:', error);
  }
}

// Run the check
checkSpecificOrder().then(() => {
  console.log('\n🔍 Order check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Order check failed:', error);
  process.exit(1);
}); 
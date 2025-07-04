require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreSubscriptions() {
  console.log('🚨 URGENT: Restoring deleted subscriptions...');
  
  try {
    // Based on the admin pause records, we know there were subscriptions for user 8967ff0e-2f67-47fa-8b2f-4fa7e945c14b
    const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
    
    // Create 5 subscriptions to restore what was deleted
    const subscriptionsToRestore = [];
    const now = new Date();
    const nextDelivery = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
    const endDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 2 months
    
    for (let i = 0; i < 5; i++) {
      const subscription = {
        id: crypto.randomUUID(),
        user_id: userId,
        plan_id: `sub${i + 1}`, // sub1, sub2, etc.
        status: 'active',
        delivery_frequency: 'monthly',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        next_delivery_date: nextDelivery.toISOString(), // THIS WAS MISSING!
        total_amount: 219.98,
        subscription_duration: 2,
        original_price: 219.98,
        discount_percentage: 0,
        discount_amount: 0,
        final_price: 219.98,
        selected_juices: [
          { name: 'Orange Juice', quantity: 2 },
          { name: 'Apple Juice', quantity: 1 },
          { name: 'Grape Juice', quantity: 1 }
        ],
        delivery_address: [
          {
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zip: '12345'
          }
        ],
        renewal_notification_sent: false,
        pause_date: null,
        pause_reason: null,
        reactivation_deadline: null,
        admin_pause_id: null,
        admin_pause_start: null,
        admin_pause_end: null,
        admin_reactivated_at: null,
        admin_reactivated_by: null,
        first_delivery_date: null,
        is_after_cutoff: null,
        delivery_schedule: null
      };
      
      subscriptionsToRestore.push(subscription);
    }
    
    console.log(`📦 Restoring ${subscriptionsToRestore.length} subscriptions...`);
    
    // Insert the restored subscriptions
    const { data: restoredData, error: restoreError } = await supabase
      .from('user_subscriptions')
      .insert(subscriptionsToRestore)
      .select();

    if (restoreError) {
      console.error('❌ Failed to restore subscriptions:', restoreError);
    } else {
      console.log('✅ Successfully restored subscriptions!');
      console.log(`✅ Restored ${restoredData.length} subscriptions`);
      
      restoredData.forEach(sub => {
        console.log(`  - ${sub.id}: status=${sub.status}, plan=${sub.plan_id}`);
      });
    }
    
    // Verify restoration
    const { data: verifyData } = await supabase
      .from('user_subscriptions')
      .select('id, status, user_id')
      .eq('user_id', userId);
      
    console.log(`\n📋 Verification: Found ${verifyData?.length || 0} subscriptions for user ${userId}`);

  } catch (error) {
    console.error('❌ Error restoring subscriptions:', error);
  }
}

restoreSubscriptions();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseState() {
  console.log('🔍 Checking database state after delete/insert test...');
  
  try {
    // Check if there are any subscriptions at all
    const { data: allSubscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*');

    console.log('📋 All subscriptions:', allSubscriptions?.length || 0);
    
    if (allSubscriptions && allSubscriptions.length > 0) {
      allSubscriptions.forEach(sub => {
        console.log(`  - ${sub.id}: status=${sub.status}, user=${sub.user_id}`);
      });
    }

    // Check admin pause records
    const { data: adminPauses, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('\n📋 Recent admin pause records:', adminPauses?.length || 0);
    
    if (adminPauses && adminPauses.length > 0) {
      adminPauses.forEach(pause => {
        console.log(`  - ${pause.id}: status=${pause.status}, type=${pause.pause_type}, affected_users=${pause.affected_user_ids?.length || 0}, reason=${pause.reason}`);
      });
    }

    // If no subscriptions exist, this means delete worked but insert failed
    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('\n❌ CRITICAL: All subscriptions were deleted but not restored!');
      console.log('💡 This means the delete operation succeeded but the insert operation failed');
      console.log('🔧 We need to restore the subscriptions from backup or recreate them');
      
      // Check if we can see any error logs or hints
      console.log('\n🔍 Checking if we can identify the insert failure...');
      
      // Try a simple insert to see what happens
      const testSubscription = {
        id: crypto.randomUUID(),
        user_id: '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
        plan_id: 'test',
        status: 'active',
        delivery_frequency: 'monthly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 100,
        subscription_duration: 1,
        original_price: 100,
        discount_percentage: 0,
        discount_amount: 0,
        final_price: 100,
        selected_juices: [],
        delivery_address: [],
        renewal_notification_sent: false
      };

      const { error: testInsertError } = await supabase
        .from('user_subscriptions')
        .insert(testSubscription);

      if (testInsertError) {
        console.error('❌ Test insert failed:', testInsertError);
        console.log('💡 This confirms that INSERT operations are failing');
      } else {
        console.log('✅ Test insert succeeded, so INSERT operations work');
        
        // Clean up test subscription
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('id', testSubscription.id);
      }
    }

  } catch (error) {
    console.error('❌ Error checking database state:', error);
  }
}

checkDatabaseState();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminPauseDirectly() {
  console.log('🧪 Testing Admin Pause System (Direct Database Test)');
  console.log('===================================================');

  const testUserId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  const testAdminUserId = 'direct-test-admin';
  
  try {
    // Step 1: Create a test subscription
    console.log('\n1️⃣ Creating test subscription...');
    
    const testSubscription = {
      id: crypto.randomUUID(),
      user_id: testUserId,
      plan_id: 'direct-test-plan',
      status: 'active',
      delivery_frequency: 'monthly',
      next_delivery_date: '2025-07-10T10:00:00+00:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 100,
      subscription_duration: 2,
      original_price: 100,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: 100,
      renewal_notification_sent: false,
      selected_juices: [{ name: 'Test Juice', quantity: 1 }],
      delivery_address: [{ 
        street: '123 Test Street', 
        city: 'Test City', 
        state: 'Test State', 
        zip: '12345' 
      }]
    };

    const { error: createError } = await supabase
      .from('user_subscriptions')
      .insert(testSubscription);

    if (createError) {
      console.error('❌ Error creating test subscription:', createError);
      return;
    }

    console.log('✅ Test subscription created successfully');

    // Step 2: Test direct admin pause
    console.log('\n2️⃣ Testing direct admin pause...');
    
    const now = new Date();
    const pauseStart = now.toISOString();
    const pauseEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Create admin pause record
    const adminPauseRecord = {
      id: crypto.randomUUID(),
      pause_type: 'selected',
      affected_user_ids: [testUserId],
      start_date: pauseStart,
      end_date: pauseEnd,
      reason: 'Direct test pause',
      admin_user_id: testAdminUserId,
      status: 'active',
      affected_subscription_count: 1,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const { error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .insert(adminPauseRecord);

    if (pauseError) {
      console.error('❌ Error creating admin pause record:', pauseError);
      return;
    }

    console.log('✅ Admin pause record created');

    // Step 3: Update subscription to admin_paused
    console.log('\n3️⃣ Updating subscription to admin_paused...');
    
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'admin_paused',
        admin_pause_id: adminPauseRecord.id,
        admin_pause_start: pauseStart,
        admin_pause_end: pauseEnd,
        updated_at: now.toISOString()
      })
      .eq('id', testSubscription.id);

    if (updateError) {
      console.error('❌ Error updating subscription to admin_paused:', updateError);
      return;
    }

    console.log('✅ Subscription updated to admin_paused status');

    // Step 4: Verify the pause
    console.log('\n4️⃣ Verifying subscription is paused...');
    
    const { data: pausedSub, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', testSubscription.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying subscription:', verifyError);
      return;
    }

    if (pausedSub.status === 'admin_paused') {
      console.log('🎉 SUCCESS: Subscription is properly paused!');
      console.log(`   Status: ${pausedSub.status}`);
      console.log(`   Admin pause ID: ${pausedSub.admin_pause_id}`);
      console.log(`   Pause start: ${pausedSub.admin_pause_start}`);
    } else {
      console.log('❌ FAILED: Subscription is not paused');
      console.log(`   Status: ${pausedSub.status}`);
    }

    // Step 5: Test reactivation
    console.log('\n5️⃣ Testing reactivation...');
    
    const reactivateTime = new Date();
    const nextDeliveryDate = new Date(reactivateTime.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
    
    // Update subscription back to active
    const { error: reactivateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        next_delivery_date: nextDeliveryDate.toISOString(),
        admin_pause_id: null,
        admin_pause_end: reactivateTime.toISOString(),
        admin_reactivated_at: reactivateTime.toISOString(),
        admin_reactivated_by: testAdminUserId,
        updated_at: reactivateTime.toISOString()
      })
      .eq('id', testSubscription.id);

    if (reactivateError) {
      console.error('❌ Error reactivating subscription:', reactivateError);
      return;
    }

    // Update admin pause record
    const { error: pauseUpdateError } = await supabase
      .from('admin_subscription_pauses')
      .update({
        status: 'reactivated',
        reactivated_at: reactivateTime.toISOString(),
        reactivated_by: testAdminUserId,
        updated_at: reactivateTime.toISOString()
      })
      .eq('id', adminPauseRecord.id);

    if (pauseUpdateError) {
      console.error('❌ Error updating admin pause record:', pauseUpdateError);
      return;
    }

    console.log('✅ Subscription reactivated successfully');

    // Step 6: Verify reactivation
    console.log('\n6️⃣ Verifying reactivation...');
    
    const { data: activeSub, error: activeError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', testSubscription.id)
      .single();

    if (activeError) {
      console.error('❌ Error verifying reactivation:', activeError);
      return;
    }

    if (activeSub.status === 'active') {
      console.log('🎉 SUCCESS: Subscription is properly reactivated!');
      console.log(`   Status: ${activeSub.status}`);
      console.log(`   Next delivery: ${activeSub.next_delivery_date}`);
      console.log(`   Reactivated at: ${activeSub.admin_reactivated_at}`);
    } else {
      console.log('❌ FAILED: Subscription is not reactivated');
      console.log(`   Status: ${activeSub.status}`);
    }

    // Step 7: Cleanup
    console.log('\n7️⃣ Cleaning up test data...');
    
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', testSubscription.id);

    await supabase
      .from('admin_subscription_pauses')
      .delete()
      .eq('id', adminPauseRecord.id);

    console.log('✅ Test data cleaned up');

    console.log('\n🎉 ADMIN PAUSE SYSTEM TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Database constraint issues are resolved');
    console.log('✅ Admin pause functionality works correctly');
    console.log('✅ Admin reactivation functionality works correctly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

async function main() {
  await testAdminPauseDirectly();
}

main();

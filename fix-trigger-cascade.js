require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTriggerCascade() {
  console.log('🔧 Fixing trigger and function with CASCADE...');
  
  try {
    // Step 1: Drop the trigger first (safer approach)
    console.log('\n1️⃣ Dropping trigger first...');
    const { data: dropTrigger, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS trigger_update_behavior_metrics ON user_subscriptions;'
    });
    
    if (triggerError) {
      console.error('❌ Failed to drop trigger:', triggerError);
    } else {
      console.log('✅ Trigger dropped successfully');
    }
    
    // Step 2: Drop the function
    console.log('\n2️⃣ Dropping function...');
    const { data: dropFunction, error: functionError } = await supabase.rpc('exec_sql', {
      sql: 'DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;'
    });
    
    if (functionError) {
      console.error('❌ Failed to drop function:', functionError);
    } else {
      console.log('✅ Function dropped successfully');
    }
    
    // Step 3: Test if we can now insert into user_subscriptions
    console.log('\n3️⃣ Testing user_subscriptions insert...');
    
    const testSubscription = {
      id: crypto.randomUUID(),
      user_id: '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
      plan_id: 'test-plan',
      status: 'active',
      delivery_frequency: 'monthly',
      next_delivery_date: '2025-07-10T10:00:00+00:00',
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
      renewal_notification_sent: false
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert(testSubscription)
      .select();
      
    if (insertError) {
      console.error('❌ Insert still failed:', insertError);
      console.log('💡 There may be other constraints or issues');
    } else {
      console.log('✅ Insert succeeded! The constraint issue is fixed!');
      console.log('📝 Test subscription created:', insertData);
      
      // Clean up the test record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', testSubscription.id);
      console.log('🧹 Test record cleaned up');
    }
    
    // Step 4: Test update operations
    console.log('\n4️⃣ Testing user_subscriptions update...');
    
    // Find an existing subscription to test update
    const { data: existingSubs, error: selectError } = await supabase
      .from('user_subscriptions')
      .select('id, status')
      .limit(1);
      
    if (selectError) {
      console.error('❌ Cannot select subscriptions:', selectError);
    } else if (existingSubs && existingSubs.length > 0) {
      const testId = existingSubs[0].id;
      const originalStatus = existingSubs[0].status;
      
      // Try to update the status
      const { data: updateData, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', testId)
        .select();
        
      if (updateError) {
        console.error('❌ Update still failed:', updateError);
      } else {
        console.log('✅ Update succeeded!');
        console.log('📝 Updated subscription:', updateData);
        
        // Restore original status
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: originalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testId);
        console.log('🔄 Original status restored');
      }
    } else {
      console.log('⚠️ No existing subscriptions found to test update');
    }
    
    console.log('\n🎉 Constraint fix testing complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Alternative approach if the RPC method doesn't work
async function fixTriggerDirectSQL() {
  console.log('\n🔧 Alternative: Direct SQL commands to run in Supabase SQL Editor...');
  
  console.log(`
📋 Run these commands in Supabase SQL Editor:

-- Step 1: Drop the trigger
DROP TRIGGER IF EXISTS trigger_update_behavior_metrics ON user_subscriptions;

-- Step 2: Drop the function with CASCADE
DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;

-- Step 3: Test insert (optional)
INSERT INTO user_subscriptions (
    id, user_id, plan_id, status, delivery_frequency, next_delivery_date,
    created_at, updated_at, subscription_start_date, subscription_end_date,
    total_amount, subscription_duration, original_price, discount_percentage,
    discount_amount, final_price, renewal_notification_sent
) VALUES (
    '${crypto.randomUUID()}',
    '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
    'test-plan',
    'active',
    'monthly',
    '2025-07-10T10:00:00+00:00',
    NOW(),
    NOW(),
    NOW(),
    NOW() + INTERVAL '30 days',
    100,
    1,
    100,
    0,
    0,
    100,
    false
);

-- Step 4: Clean up test record (run after testing)
DELETE FROM user_subscriptions WHERE plan_id = 'test-plan';
  `);
}

// Run both approaches
async function main() {
  await fixTriggerCascade();
  await fixTriggerDirectSQL();
}

main();

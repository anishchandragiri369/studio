require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCascadeDrop() {
  console.log('🔧 Dropping trigger and function with CASCADE...');
  
  try {
    // Step 1: Drop the function with CASCADE (this will also drop the trigger)
    console.log('🗑️ Dropping function with CASCADE...');
    const { data: dropData, error: dropError } = await supabase.rpc('exec_sql', {
      query: 'DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;'
    });
    
    if (dropError) {
      console.error('❌ Error dropping function with CASCADE:', dropError);
      
      // If exec_sql doesn't work, let's try direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // Try using a different approach - check what's actually there first
      const { data: checkData, error: checkError } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'trigger_update_behavior_metrics');
        
      if (!checkError) {
        console.log('📊 Found triggers:', checkData);
      }
      
      return;
    }
    
    console.log('✅ Function and trigger dropped successfully');
    
    // Step 2: Verify the trigger is gone
    console.log('🔍 Verifying trigger removal...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'trigger_update_behavior_metrics');
      
    if (verifyError) {
      console.log('ℹ️ Cannot query triggers table (this might be normal)');
    } else {
      console.log('📊 Remaining triggers with that name:', verifyData?.length || 0);
    }
    
    // Step 3: Test if we can now insert into user_subscriptions
    console.log('🧪 Testing insert into user_subscriptions...');
    
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
      .insert(testSubscription);
      
    if (insertError) {
      console.error('❌ Insert still failing:', insertError);
      console.log('💡 There may be other issues to resolve');
    } else {
      console.log('✅ INSERT SUCCESS! The constraint issue is fixed!');
      
      // Clean up the test record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', testSubscription.id);
        
      console.log('🧹 Test record cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Also provide the exact SQL commands to run manually in Supabase SQL Editor
console.log('\n📋 MANUAL SQL COMMANDS FOR SUPABASE SQL EDITOR:');
console.log('Copy and paste these commands one by one:\n');

console.log('-- Step 1: Drop the function and trigger with CASCADE');
console.log('DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;\n');

console.log('-- Step 2: Verify the trigger is gone');
console.log('SELECT * FROM information_schema.triggers WHERE trigger_name = \'trigger_update_behavior_metrics\';\n');

console.log('-- Step 3: Test insert (replace with your actual user_id)');
console.log(`INSERT INTO user_subscriptions (
  id, user_id, plan_id, status, delivery_frequency, next_delivery_date,
  created_at, updated_at, subscription_start_date, subscription_end_date,
  total_amount, subscription_duration, original_price, discount_percentage,
  discount_amount, final_price, renewal_notification_sent
) VALUES (
  gen_random_uuid(),
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
);\n`);

console.log('-- Step 4: If insert succeeds, clean up the test record');
console.log('DELETE FROM user_subscriptions WHERE plan_id = \'test-plan\';\n');

fixCascadeDrop();

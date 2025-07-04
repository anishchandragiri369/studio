require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConstraintFix() {
  console.log('🧪 Testing if database constraint issue is fixed...');
  
  try {
    // Test 1: Try a simple minimal INSERT to user_subscriptions
    console.log('\n1️⃣ Testing INSERT operation...');
    
    const testSubscription = {
      id: crypto.randomUUID(),
      user_id: '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
      plan_id: 'constraint-test',
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
      console.error('❌ INSERT failed:', insertError);
      
      if (insertError.code === '42P10') {
        console.log('💡 Database constraint issue still exists!');
        console.log('🔧 You need to run the SQL commands in Supabase SQL Editor:');
        console.log('\n   DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;\n');
        return false;
      }
    } else {
      console.log('✅ INSERT succeeded! Constraint issue is fixed.');
      
      // Clean up test record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', testSubscription.id);
        
      console.log('🧹 Test record cleaned up');
    }
    
    // Test 2: Try an UPDATE operation
    console.log('\n2️⃣ Testing UPDATE operation...');
    
    // Get an existing subscription
    const { data: existingSubscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Could not fetch existing subscriptions:', fetchError);
      return false;
    }
    
    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const testSub = existingSubscriptions[0];
      
      // Try to update it
      const { data: updateData, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          updated_at: new Date().toISOString(),
          // Try to update status - this should work if constraint is fixed
          status: testSub.status === 'active' ? 'active' : 'active'
        })
        .eq('id', testSub.id);
        
      if (updateError) {
        console.error('❌ UPDATE failed:', updateError);
        
        if (updateError.code === '42P10') {
          console.log('💡 Database constraint issue still exists!');
          console.log('🔧 You need to run the SQL commands in Supabase SQL Editor:');
          console.log('\n   DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;\n');
          return false;
        }
      } else {
        console.log('✅ UPDATE succeeded! Constraint issue is fixed.');
      }
    } else {
      console.log('⚠️  No existing subscriptions found to test UPDATE');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🔍 Admin Pause Database Constraint Test');
  console.log('=====================================');
  
  const isFixed = await testConstraintFix();
  
  if (isFixed) {
    console.log('\n🎉 Database constraint issue appears to be FIXED!');
    console.log('✅ Admin pause system should now work properly');
    console.log('🔧 Next steps:');
    console.log('   1. Remove workaround logic from admin pause endpoints');
    console.log('   2. Update pause logic to directly modify subscription status');
    console.log('   3. Test admin pause functionality');
  } else {
    console.log('\n❌ Database constraint issue still EXISTS!');
    console.log('🔧 Required action:');
    console.log('   1. Go to Supabase SQL Editor');
    console.log('   2. Run: DROP FUNCTION IF EXISTS update_customer_behavior_metrics() CASCADE;');
    console.log('   3. Re-run this test');
    console.log('   4. Then fix the admin pause logic');
  }
}

main();

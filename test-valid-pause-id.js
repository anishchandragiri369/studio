require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithExistingPauseId() {
  console.log('🔍 Testing with existing admin pause ID...');
  
  try {
    // Get existing admin pause record
    const { data: adminPause, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (pauseError || !adminPause) {
      console.error('❌ No admin pause record found:', pauseError);
      return;
    }

    console.log(`📋 Using existing admin pause ID: ${adminPause.id}`);

    // Get a subscription to test with
    const { data: subscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (fetchError || !subscription) {
      console.error('❌ Error fetching subscription:', fetchError);
      return;
    }

    console.log(`📋 Testing with subscription: ${subscription.id}`);

    // Test updating with valid admin_pause_id
    console.log('🧪 Testing update with valid admin_pause_id...');
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        admin_pause_id: adminPause.id,
        pause_date: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('❌ Update failed even with valid admin_pause_id:', updateError);
      
      // Check if it's still the constraint issue
      if (updateError.code === '42P10') {
        console.log('💡 This appears to be a table structure or RLS policy issue');
        console.log('💡 Let me check if we can disable RLS temporarily...');
        
        // Try with a raw SQL approach via function call
        console.log('🧪 Trying direct SQL...');
        const { error: sqlError } = await supabase.rpc('direct_update_subscription', {
          subscription_id: subscription.id,
          admin_pause_id: adminPause.id
        });
        
        if (sqlError) {
          console.log('❌ Direct SQL also failed:', sqlError);
        } else {
          console.log('✅ Direct SQL worked!');
        }
      }
    } else {
      console.log('✅ Update successful with valid admin_pause_id!');
      
      // Verify the update
      const { data: updated } = await supabase
        .from('user_subscriptions')
        .select('admin_pause_id, pause_date')
        .eq('id', subscription.id)
        .single();
        
      console.log('📋 Updated fields:', updated);
      
      // Clean up
      await supabase
        .from('user_subscriptions')
        .update({ 
          admin_pause_id: null,
          pause_date: null
        })
        .eq('id', subscription.id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testWithExistingPauseId();

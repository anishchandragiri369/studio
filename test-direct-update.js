require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDirectUpdate() {
  console.log('🧪 Testing direct SQL update...');
  
  try {
    // Get an active subscription
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, status')
      .eq('status', 'active')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️  No active subscriptions found');
      return;
    }

    const subscription = subscriptions[0];
    console.log(`📋 Testing with subscription: ${subscription.id}`);

    // Try using rpc or direct SQL
    const { data, error } = await supabase.rpc('update_subscription_status', {
      subscription_id: subscription.id,
      new_status: 'admin_paused'
    });

    if (error) {
      console.log('❌ RPC method not available, trying with pure SQL...');
      
      // Try with a simple direct query
      const { error: sqlError } = await supabase
        .from('user_subscriptions')
        .update({ status: 'admin_paused' })
        .eq('id', subscription.id)
        .select(); // Add select to ensure we're not using ON CONFLICT

      if (sqlError) {
        console.error('❌ SQL Error:', sqlError);
      } else {
        console.log('✅ Direct SQL update successful');
        
        // Verify the update
        const { data: updated } = await supabase
          .from('user_subscriptions')
          .select('id, status')
          .eq('id', subscription.id)
          .single();
          
        console.log(`📋 Updated status: ${updated?.status}`);
        
        // Revert back
        await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('id', subscription.id);
          
        console.log('✅ Reverted to active status');
      }
    } else {
      console.log('✅ RPC update successful:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDirectUpdate();

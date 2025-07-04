require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUpdateIssue() {
  console.log('🔍 Debugging subscription update issue...');
  
  try {
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

    // Test 1: Try minimal field update
    console.log('🧪 Test 1: Updating only updated_at field...');
    const { error: test1Error } = await supabase
      .from('user_subscriptions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', subscription.id);

    if (test1Error) {
      console.error('❌ Test 1 failed:', test1Error);
    } else {
      console.log('✅ Test 1 passed - basic update works');
    }

    // Test 2: Try updating admin_pause_id only
    console.log('🧪 Test 2: Updating admin_pause_id only...');
    const testPauseId = crypto.randomUUID();
    const { error: test2Error } = await supabase
      .from('user_subscriptions')
      .update({ admin_pause_id: testPauseId })
      .eq('id', subscription.id);

    if (test2Error) {
      console.error('❌ Test 2 failed:', test2Error);
    } else {
      console.log('✅ Test 2 passed - admin_pause_id update works');
      
      // Clean up
      await supabase
        .from('user_subscriptions')
        .update({ admin_pause_id: null })
        .eq('id', subscription.id);
    }

    // Test 3: Try updating status only
    console.log('🧪 Test 3: Updating status only...');
    const { error: test3Error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'admin_paused' })
      .eq('id', subscription.id);

    if (test3Error) {
      console.error('❌ Test 3 failed:', test3Error);
    } else {
      console.log('✅ Test 3 passed - status update works');
      
      // Revert
      await supabase
        .from('user_subscriptions')
        .update({ status: 'active' })
        .eq('id', subscription.id);
    }

    // Test 4: Try multiple fields
    console.log('🧪 Test 4: Updating multiple fields...');
    const { error: test4Error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'admin_paused',
        admin_pause_id: testPauseId,
        pause_date: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (test4Error) {
      console.error('❌ Test 4 failed:', test4Error);
    } else {
      console.log('✅ Test 4 passed - multiple field update works');
      
      // Revert
      await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          admin_pause_id: null,
          pause_date: null
        })
        .eq('id', subscription.id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugUpdateIssue();

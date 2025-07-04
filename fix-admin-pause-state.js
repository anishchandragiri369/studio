require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStuckSubscriptions() {
  console.log('🔧 Fixing subscriptions stuck in workaround state...');
  
  try {
    // Find subscriptions that should be admin_paused based on admin pause records
    console.log('\n1️⃣ Finding active admin pause records...');
    
    const { data: activePauses, error: pausesError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active');

    if (pausesError) {
      console.error('❌ Error fetching admin pauses:', pausesError);
      return;
    }

    console.log(`📊 Found ${activePauses?.length || 0} active admin pause records`);

    if (!activePauses || activePauses.length === 0) {
      console.log('✅ No active admin pauses found - nothing to fix');
      return;
    }

    let totalFixed = 0;

    // Process each admin pause record
    for (const pause of activePauses) {
      console.log(`\n🔍 Processing admin pause: ${pause.id}`);
      console.log(`   Type: ${pause.pause_type}`);
      console.log(`   Reason: ${pause.reason}`);

      // Find subscriptions that should be paused but aren't
      let subscriptionQuery = supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active'); // Find active subscriptions that should be paused

      if (pause.pause_type === 'selected' && pause.affected_user_ids) {
        subscriptionQuery = subscriptionQuery.in('user_id', pause.affected_user_ids);
      }

      const { data: subscriptionsToFix, error: subsError } = await subscriptionQuery;

      if (subsError) {
        console.error(`❌ Error fetching subscriptions for pause ${pause.id}:`, subsError);
        continue;
      }

      if (!subscriptionsToFix || subscriptionsToFix.length === 0) {
        console.log(`✅ No subscriptions need fixing for pause ${pause.id}`);
        continue;
      }

      console.log(`🔧 Found ${subscriptionsToFix.length} subscriptions to fix`);

      // Update subscriptions to admin_paused status
      for (const subscription of subscriptionsToFix) {
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'admin_paused',
            admin_pause_id: pause.id,
            admin_pause_start: pause.start_date,
            admin_pause_end: pause.end_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`❌ Error updating subscription ${subscription.id}:`, updateError);
        } else {
          console.log(`✅ Fixed subscription ${subscription.id} (User: ${subscription.user_id})`);
          totalFixed++;
        }
      }
    }

    console.log(`\n🎉 Successfully fixed ${totalFixed} subscriptions!`);

    // Verify the fix
    console.log('\n🔍 Verification: Counting admin paused subscriptions...');
    
    const { data: pausedSubs, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'admin_paused');

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
    } else {
      console.log(`✅ Total admin paused subscriptions: ${pausedSubs?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error);
  }
}

async function checkCurrentState() {
  console.log('📊 Current Database State:');
  console.log('=========================');

  try {
    // Count admin pause records
    const { data: adminPauses, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('*');

    console.log(`Admin pause records: ${adminPauses?.length || 0}`);
    if (adminPauses) {
      const active = adminPauses.filter(p => p.status === 'active').length;
      console.log(`  - Active: ${active}`);
      console.log(`  - Inactive: ${adminPauses.length - active}`);
    }

    // Count subscription statuses
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('status');

    if (subscriptions) {
      const statusCounts = subscriptions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\nSubscription statuses:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking current state:', error);
  }
}

async function main() {
  console.log('🔧 Admin Pause System Fix Utility');
  console.log('==================================');
  
  await checkCurrentState();
  
  console.log('\n' + '='.repeat(50));
  
  await fixStuckSubscriptions();
  
  console.log('\n' + '='.repeat(50));
  
  console.log('\n📊 Final State:');
  await checkCurrentState();
}

main();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reactivateAdminPause() {
  console.log('🔧 Reactivating Admin Pause');
  console.log('===========================\n');

  try {
    // Step 1: Find active admin pauses
    console.log('1️⃣ Finding active admin pauses...');
    
    const { data: activePauses, error: pauseError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (pauseError) {
      console.error('❌ Error fetching admin pauses:', pauseError);
      return;
    }

    if (!activePauses || activePauses.length === 0) {
      console.log('✅ No active admin pauses found');
      return;
    }

    console.log(`Found ${activePauses.length} active admin pause(s):`);
    activePauses.forEach((pause, index) => {
      console.log(`\nPause ${index + 1}:`);
      console.log(`  - ID: ${pause.id}`);
      console.log(`  - Type: ${pause.pause_type}`);
      console.log(`  - Reason: ${pause.reason}`);
      console.log(`  - Start Date: ${pause.start_date}`);
      console.log(`  - End Date: ${pause.end_date || 'Indefinite'}`);
      console.log(`  - Affected Subscriptions: ${pause.affected_subscription_count}`);
    });

    // Step 2: Reactivate the first active pause (or you can specify which one)
    const pauseToReactivate = activePauses[0]; // Reactivate the most recent one
    
    console.log(`\n2️⃣ Reactivating pause: ${pauseToReactivate.reason}`);
    
    const now = new Date();
    
    // Update the admin pause status
    const { error: updatePauseError } = await supabase
      .from('admin_subscription_pauses')
      .update({
        status: 'reactivated',
        updated_at: now.toISOString(),
        reactivated_at: now.toISOString()
      })
      .eq('id', pauseToReactivate.id);

    if (updatePauseError) {
      console.error('❌ Error updating admin pause:', updatePauseError);
      return;
    }

    console.log('✅ Admin pause status updated to reactivated');

    // Step 3: Reactivate affected subscriptions
    console.log('\n3️⃣ Reactivating affected subscriptions...');
    
    const { data: affectedSubscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, plan_id')
      .eq('admin_pause_id', pauseToReactivate.id)
      .eq('status', 'admin_paused');

    if (subError) {
      console.error('❌ Error fetching affected subscriptions:', subError);
      return;
    }

    console.log(`Found ${affectedSubscriptions?.length || 0} affected subscriptions`);

    if (affectedSubscriptions && affectedSubscriptions.length > 0) {
      let reactivatedCount = 0;
      
      for (const subscription of affectedSubscriptions) {
        try {
          // Reactivate the subscription
          const { error: reactivateError } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'active',
              admin_pause_id: null,
              admin_pause_start: null,
              admin_pause_end: now.toISOString(),
              admin_reactivated_at: now.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', subscription.id);

          if (reactivateError) {
            console.error(`❌ Error reactivating subscription ${subscription.id}:`, reactivateError);
          } else {
            console.log(`✅ Reactivated subscription ${subscription.id}`);
            reactivatedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing subscription ${subscription.id}:`, error);
        }
      }

      console.log(`\n✅ Successfully reactivated ${reactivatedCount} out of ${affectedSubscriptions.length} subscriptions`);
    }

    // Step 4: Create audit log
    console.log('\n4️⃣ Creating audit log...');
    
    const auditLog = {
      id: require('crypto').randomUUID(),
      admin_user_id: 'script-reactivation', // Since this is a script
      action: 'ADMIN_REACTIVATE_PAUSE',
      details: {
        pauseId: pauseToReactivate.id,
        pauseReason: pauseToReactivate.reason,
        reactivatedAt: now.toISOString(),
        affectedSubscriptions: affectedSubscriptions?.length || 0
      },
      created_at: now.toISOString()
    };

    const { error: auditError } = await supabase
      .from('admin_audit_logs')
      .insert(auditLog);

    if (auditError) {
      console.error('⚠️  Warning: Could not create audit log:', auditError);
    } else {
      console.log('✅ Audit log created');
    }

    console.log('\n🎉 Admin pause reactivation completed successfully!');
    console.log('New subscriptions can now be created.');

  } catch (error) {
    console.error('❌ Error in reactivation:', error);
  }
}

// Run the reactivation
reactivateAdminPause().then(() => {
  console.log('\n🔧 Admin pause reactivation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Admin pause reactivation failed:', error);
  process.exit(1);
}); 
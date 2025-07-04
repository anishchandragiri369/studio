const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debug: Checking Subscription Statuses');
console.log('='.repeat(50));

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubscriptionStatuses() {
  try {
    // Check all subscriptions
    console.log('📋 All Subscriptions:');
    const { data: allSubs, error: allError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, status, admin_pause_id, pause_date, admin_pause_start, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching subscriptions:', allError.message);
      return;
    }

    if (!allSubs || allSubs.length === 0) {
      console.log('⚠️  No subscriptions found in database');
      return;
    }

    console.log(`Found ${allSubs.length} subscriptions:`);
    allSubs.forEach((sub, index) => {
      console.log(`${index + 1}. ID: ${sub.id}`);
      console.log(`   User: ${sub.user_id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Admin Pause ID: ${sub.admin_pause_id || 'None'}`);
      console.log(`   Pause Date: ${sub.pause_date || 'None'}`);
      console.log(`   Admin Pause Start: ${sub.admin_pause_start || 'None'}`);
      console.log(`   Created: ${sub.created_at}`);
      console.log('');
    });

    // Check specifically for admin paused subscriptions
    console.log('🔍 Admin Paused Subscriptions:');
    const { data: adminPaused, error: pausedError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'admin_paused');

    if (pausedError) {
      console.error('❌ Error fetching admin paused subscriptions:', pausedError.message);
      return;
    }

    if (!adminPaused || adminPaused.length === 0) {
      console.log('⚠️  No admin paused subscriptions found');
    } else {
      console.log(`Found ${adminPaused.length} admin paused subscriptions:`);
      adminPaused.forEach((sub, index) => {
        console.log(`${index + 1}. ID: ${sub.id}, User: ${sub.user_id}, Pause ID: ${sub.admin_pause_id}`);
      });
    }

    // Check admin pause records
    console.log('\n📝 Admin Pause Records:');
    const { data: pauseRecords, error: recordsError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recordsError) {
      console.error('❌ Error fetching admin pause records:', recordsError.message);
    } else if (!pauseRecords || pauseRecords.length === 0) {
      console.log('⚠️  No admin pause records found');
    } else {
      console.log(`Found ${pauseRecords.length} admin pause records:`);
      pauseRecords.forEach((record, index) => {
        console.log(`${index + 1}. ID: ${record.id}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Reason: ${record.reason}`);
        console.log(`   Start: ${record.start_date}`);
        console.log(`   End: ${record.end_date || 'Indefinite'}`);
        console.log(`   Created: ${record.created_at}`);
        console.log('');
      });
    }

    // Summary
    const statusCounts = allSubs.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkSubscriptionStatuses();

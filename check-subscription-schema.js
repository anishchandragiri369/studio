require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubscriptionSchema() {
  console.log('🔍 Checking subscription table schema...');
  
  try {
    // First, let's see what columns exist in user_subscriptions
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying subscriptions:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('📋 Available columns in user_subscriptions:');
      Object.keys(data[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof data[0][column]} (${data[0][column]})`);
      });
    }

    // Let's also check if the columns we're trying to update exist
    const testSubscription = data[0];
    console.log('\n🧪 Testing update with minimal changes...');
    
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'admin_paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSubscription.id);

    if (updateError) {
      console.error('❌ Error with minimal update:', updateError);
    } else {
      console.log('✅ Minimal update successful');
      
      // Revert back to active
      const { error: revertError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testSubscription.id);
        
      if (revertError) {
        console.error('❌ Error reverting:', revertError);
      } else {
        console.log('✅ Reverted to active status');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSubscriptionSchema();

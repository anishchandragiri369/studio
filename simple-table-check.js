/**
 * Simple script to check user_rewards table structure
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

async function checkTable() {
  console.log('🔍 Checking user_rewards table...\n');

  try {
    // Try to insert a test record to see what columns are expected
    const testUserId = '12345678-1234-1234-1234-123456789012';
    
    console.log('📋 Attempting to insert test record to check required columns...\n');
    
    // Try with minimal columns first
    const { data: test1, error: error1 } = await supabase
      .from('user_rewards')
      .insert([{
        user_id: testUserId,
        total_points: 5,
        total_earned: 2.5,
        referral_code: 'TEST123',
        referrals_count: 0,
        last_updated: new Date().toISOString()
      }])
      .select();

    if (error1) {
      console.log('❌ Error with basic insert:', error1.message);
      
      // Try with redeemed_points
      const { data: test2, error: error2 } = await supabase
        .from('user_rewards')
        .insert([{
          user_id: testUserId,
          total_points: 5,
          total_earned: 2.5,
          referral_code: 'TEST123',
          referrals_count: 0,
          redeemed_points: 0,
          last_updated: new Date().toISOString()
        }])
        .select();

      if (error2) {
        console.log('❌ Error with redeemed_points:', error2.message);
        
        console.log('\n🔧 The table is missing the redeemed_points column.');
        console.log('📝 Please run this SQL in Supabase SQL editor:');
        console.log('\nALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS redeemed_points INTEGER DEFAULT 0;');
        console.log('ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS available_points INTEGER GENERATED ALWAYS AS (total_points - redeemed_points) STORED;');
      } else {
        console.log('✅ Test insert with redeemed_points successful');
        console.table(test2);
        
        // Clean up test record
        await supabase
          .from('user_rewards')
          .delete()
          .eq('user_id', testUserId);
        console.log('🧹 Test record cleaned up');
      }
    } else {
      console.log('✅ Test insert successful');
      console.table(test1);
      
      // Clean up test record
      await supabase
        .from('user_rewards')
        .delete()
        .eq('user_id', testUserId);
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkTable();

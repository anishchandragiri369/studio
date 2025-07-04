require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugAdminPauseRecord() {
  console.log('🔍 Debugging Admin Pause Record Creation');
  console.log('=======================================');

  try {
    // First, let's check the admin_subscription_pauses table structure
    console.log('\n1️⃣ Checking table structure...');
    
    const { data: existingRecords, error: fetchError } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error accessing admin_subscription_pauses table:', fetchError);
      return;
    } else {
      console.log('✅ Can access admin_subscription_pauses table');
      console.log(`📊 Current records: ${existingRecords?.length || 0}`);
    }

    // Try to create a minimal admin pause record
    console.log('\n2️⃣ Testing minimal admin pause record creation...');
    
    const testRecord = {
      id: crypto.randomUUID(),
      pause_type: 'selected',
      affected_user_ids: ['8967ff0e-2f67-47fa-8b2f-4fa7e945c14b'],
      start_date: new Date(Date.now() + 10000).toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Debug test',
      admin_user_id: crypto.randomUUID(), // Use proper UUID
      status: 'active',
      affected_subscription_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Attempting to insert record:', JSON.stringify(testRecord, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('admin_subscription_pauses')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.error('❌ Failed to insert admin pause record:', insertError);
      console.log('\n🔍 Error details:');
      console.log('- Code:', insertError.code);
      console.log('- Message:', insertError.message);
      console.log('- Details:', insertError.details);
    } else {
      console.log('✅ Successfully created admin pause record!');
      console.log('📊 Inserted data:', insertData);
      
      // Clean up
      await supabase
        .from('admin_subscription_pauses')
        .delete()
        .eq('id', testRecord.id);
        
      console.log('🧹 Test record cleaned up');
    }

    // Also let's check if there are any constraints or issues with the table
    console.log('\n3️⃣ Checking for table constraints...');
    
    // Try a very simple insert
    const simpleRecord = {
      id: crypto.randomUUID(),
      pause_type: 'selected',
      start_date: new Date(Date.now() + 10000).toISOString(),
      reason: 'Simple test',
      admin_user_id: crypto.randomUUID(), // Use proper UUID
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: simpleError } = await supabase
      .from('admin_subscription_pauses')
      .insert(simpleRecord);

    if (simpleError) {
      console.error('❌ Even simple record failed:', simpleError);
    } else {
      console.log('✅ Simple record succeeded');
      
      // Clean up
      await supabase
        .from('admin_subscription_pauses')
        .delete()
        .eq('id', simpleRecord.id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugAdminPauseRecord();

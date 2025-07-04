// Script to verify database schema and prepare for migration
const { createClient } = require('@supabase/supabase-js');

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema for user_subscriptions table...\n');

  try {
    // Try to fetch a sample subscription to see current schema
    const { data: sampleSub, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('❌ Error fetching sample subscription:', fetchError);
      return;
    }

    if (sampleSub) {
      console.log('✅ Sample subscription found:');
      console.log('Columns present:', Object.keys(sampleSub));
      
      // Check if selected_fruit_bowls column exists
      if ('selected_fruit_bowls' in sampleSub) {
        console.log('✅ selected_fruit_bowls column EXISTS in database');
        console.log('Value:', sampleSub.selected_fruit_bowls);
      } else {
        console.log('❌ selected_fruit_bowls column MISSING from database');
        console.log('📋 Migration needed: Run add_fruit_bowls_to_subscriptions.sql');
      }
    } else {
      console.log('ℹ️  No existing subscriptions found in database');
      console.log('📋 We need to check the table schema directly');
    }

    // Test if we can insert a record with selected_fruit_bowls
    console.log('\n🧪 Testing insert with selected_fruit_bowls...');
    
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      plan_id: 'test-plan',
      delivery_frequency: 'weekly',
      selected_juices: [{ id: 'test', name: 'Test Juice' }],
      selected_fruit_bowls: [{ id: 'test', name: 'Test Bowl' }],
      delivery_address: { test: true },
      total_amount: 100,
      next_delivery_date: new Date().toISOString()
    };

    // This will fail if the column doesn't exist
    const { data: testInsert, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      if (insertError.message.includes('column "selected_fruit_bowls" of relation "user_subscriptions" does not exist')) {
        console.log('❌ Confirmed: selected_fruit_bowls column does not exist');
        console.log('📋 Please run the following SQL migration:');
        console.log('\n--- SQL Migration ---');
        console.log('ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS selected_fruit_bowls JSONB DEFAULT \'[]\'::jsonb;');
        console.log('UPDATE user_subscriptions SET selected_fruit_bowls = \'[]\'::jsonb WHERE selected_fruit_bowls IS NULL;');
        console.log('ALTER TABLE user_subscriptions ADD CONSTRAINT check_selected_fruit_bowls_is_array CHECK (jsonb_typeof(selected_fruit_bowls) = \'array\');');
        console.log('--- End Migration ---\n');
      } else {
        console.log('❌ Insert failed with different error:', insertError.message);
      }
    } else {
      console.log('✅ Test insert successful - selected_fruit_bowls column exists!');
      console.log('Test record ID:', testInsert.id);
      
      // Clean up test record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', testInsert.id);
      console.log('✅ Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

async function testEndToEndFlow() {
  console.log('\n🔄 Testing end-to-end customized subscription flow...\n');

  // First check if schema is ready
  await checkDatabaseSchema();

  console.log('\n📋 Next Steps:');
  console.log('1. Run the SQL migration to add selected_fruit_bowls column');
  console.log('2. Create a test order with both juices and fruit bowls');
  console.log('3. Process payment webhook');
  console.log('4. Verify subscription is created in user_subscriptions table');
  console.log('5. Confirm both selected_juices and selected_fruit_bowls are stored');

  console.log('\n🎯 Expected Behavior:');
  console.log('- Juice-only plans: selected_juices has data, selected_fruit_bowls is empty array');
  console.log('- Fruit bowl-only plans: selected_fruit_bowls has data, selected_juices is empty array');
  console.log('- Customized plans: Both selected_juices and selected_fruit_bowls have data');
}

// Run the checks
if (require.main === module) {
  testEndToEndFlow()
    .then(() => {
      console.log('\n✨ Database schema check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseSchema, testEndToEndFlow };

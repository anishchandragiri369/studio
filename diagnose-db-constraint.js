require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseAndFixDbConstraint() {
  console.log('🔍 Diagnosing database constraint issue...');
  
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

    // Test 1: Try using upsert instead of update
    console.log('🧪 Test 1: Using UPSERT operation...');
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert({
        id: subscription.id,
        ...subscription,
        status: 'admin_paused',
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('❌ Upsert failed:', upsertError);
    } else {
      console.log('✅ Upsert successful! This suggests the issue is with UPDATE operation');
      
      // Revert back
      await supabase
        .from('user_subscriptions')
        .upsert({
          id: subscription.id,
          ...subscription,
          status: 'active'
        });
    }

    // Test 2: Try using raw SQL via RPC
    console.log('🧪 Test 2: Testing if we can create a custom function...');
    
    // First, let's see what functions are available
    const { data: functions, error: funcError } = await supabase.rpc('get_schema_version');
    
    if (funcError && funcError.code === 'PGRST202') {
      console.log('⚠️  No custom functions available, let\'s try a different approach...');
      
      // Test 3: Try update with select to return data
      console.log('🧪 Test 3: Update with RETURNING clause...');
      const { data: updateData, error: updateWithReturnError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'admin_paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
        .select();

      if (updateWithReturnError) {
        console.error('❌ Update with RETURNING failed:', updateWithReturnError);
        
        // Test 4: Check if there are any table constraints
        console.log('🧪 Test 4: Checking table constraints and triggers...');
        
        // Try to get table info (this might not work with service role limitations)
        const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', {
          table_name: 'user_subscriptions'
        });
        
        if (tableError) {
          console.log('⚠️  Cannot get table info directly, trying alternative diagnosis...');
          
          // Test 5: Try minimal update without any special fields
          console.log('🧪 Test 5: Minimal field update...');
          const { error: minimalError } = await supabase
            .from('user_subscriptions')
            .update({ 
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
            
          if (minimalError) {
            console.error('❌ Even minimal update failed:', minimalError);
            console.log('💡 This suggests RLS policy or table-level constraint issues');
            
            // Test 6: Try to bypass potential RLS issues by using different user context
            console.log('🧪 Test 6: Checking if this is an RLS issue...');
            
            // The issue might be in how Supabase client is configured
            // Let's try creating a new client with different options
            const altSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false
                },
                db: {
                  schema: 'public'
                }
              }
            );
            
            const { error: altUpdateError } = await altSupabase
              .from('user_subscriptions')
              .update({ 
                status: 'admin_paused'
              })
              .eq('id', subscription.id);
              
            if (altUpdateError) {
              console.error('❌ Alternative client also failed:', altUpdateError);
              console.log('🔧 SOLUTION: We need to fix this at the database level');
              console.log('💡 This is likely a Supabase configuration or database schema issue');
              
              // Suggest manual fix
              console.log('\n📋 MANUAL FIX REQUIRED:');
              console.log('1. Check Supabase dashboard for RLS policies on user_subscriptions table');
              console.log('2. Check for any triggers on the table');
              console.log('3. Verify table constraints and foreign keys');
              console.log('4. Consider temporarily disabling RLS for testing');
              
            } else {
              console.log('✅ Alternative client worked! Issue is with client configuration');
              
              // Revert
              await altSupabase
                .from('user_subscriptions')
                .update({ status: 'active' })
                .eq('id', subscription.id);
            }
          } else {
            console.log('✅ Minimal update worked, issue is with specific fields');
          }
        }
      } else {
        console.log('✅ Update with RETURNING worked:', updateData);
        
        // Revert
        await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('id', subscription.id);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseAndFixDbConstraint();

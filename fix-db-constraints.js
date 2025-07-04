require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabaseConstraints() {
  console.log('🔧 Attempting to fix database constraints causing 42P10 error...');
  
  try {
    // The 42P10 error specifically mentions "no unique or exclusion constraint matching the ON CONFLICT specification"
    // This suggests Supabase is trying to use UPSERT internally but the table lacks proper constraints
    
    console.log('\n1️⃣ Testing different approaches to bypass constraint issues...');
    
    // Approach 1: Try using explicit conflict resolution
    console.log('🧪 Test 1: Using explicit upsert with conflict resolution...');
    
    const testRecord = {
      id: crypto.randomUUID(),
      user_id: '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
      plan_id: 'test',
      status: 'active',
      delivery_frequency: 'monthly',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      next_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 100,
      subscription_duration: 1,
      original_price: 100,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: 100,
      renewal_notification_sent: false,
      selected_juices: [],
      delivery_address: []
    };
    
    // Try upsert with specific conflict column
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(testRecord, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });
    
    if (upsertError) {
      console.log('❌ Upsert with conflict resolution failed:', upsertError);
      
      // Approach 2: Try insert without any conflict handling
      console.log('🧪 Test 2: Plain insert without conflict handling...');
      
      const { error: plainInsertError } = await supabase
        .from('user_subscriptions')
        .insert(testRecord);
        
      if (plainInsertError) {
        console.log('❌ Plain insert failed:', plainInsertError);
        
        // Approach 3: Check if it's a client configuration issue
        console.log('🧪 Test 3: Different client configuration...');
        
        // Create client without auto-upsert behavior
        const rawClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          {
            db: {
              schema: 'public'
            },
            auth: {
              autoRefreshToken: false,
              persistSession: false
            },
            global: {
              headers: {
                'Prefer': 'return=minimal'
              }
            }
          }
        );
        
        const { error: rawClientError } = await rawClient
          .from('user_subscriptions')
          .insert(testRecord);
          
        if (rawClientError) {
          console.log('❌ Raw client insert failed:', rawClientError);
          
          // Approach 4: Try to disable RLS temporarily via SQL
          console.log('🧪 Test 4: Attempting to check/disable RLS...');
          
          // Check if we can query system tables directly
          const { data: systemCheck, error: systemError } = await supabase
            .from('pg_class')
            .select('relname, relrowsecurity')
            .eq('relname', 'user_subscriptions');
            
          if (systemError) {
            console.log('❌ Cannot access system tables:', systemError);
            
            // Final approach: Try creating a completely new table with same structure
            console.log('🧪 Test 5: Creating temporary table...');
            
            const createTableSql = `
              CREATE TABLE IF NOT EXISTS user_subscriptions_temp (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                plan_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                delivery_frequency TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                subscription_start_date TIMESTAMPTZ NOT NULL,
                subscription_end_date TIMESTAMPTZ NOT NULL,
                next_delivery_date TIMESTAMPTZ NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                subscription_duration INTEGER NOT NULL,
                original_price DECIMAL(10,2) NOT NULL,
                discount_percentage DECIMAL(5,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                final_price DECIMAL(10,2) NOT NULL,
                renewal_notification_sent BOOLEAN DEFAULT FALSE,
                selected_juices JSONB DEFAULT '[]',
                delivery_address JSONB DEFAULT '[]'
              );
            `;
            
            console.log('🔧 Creating temporary table to test...');
            console.log('💡 If this works, we can identify the issue with the original table');
            
            // We can't execute raw SQL directly, so let's suggest manual steps
            console.log('\n📋 MANUAL STEPS TO FIX THE ISSUE:');
            console.log('='.repeat(50));
            console.log('1. Go to Supabase Dashboard > SQL Editor');
            console.log('2. Run the following commands to check and fix constraints:');
            console.log('');
            console.log('-- Check if RLS is enabled');
            console.log('SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = \'user_subscriptions\';');
            console.log('');
            console.log('-- Disable RLS temporarily to test');
            console.log('ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;');
            console.log('');
            console.log('-- Check table constraints');
            console.log('SELECT * FROM information_schema.table_constraints WHERE table_name = \'user_subscriptions\';');
            console.log('');
            console.log('-- Check for problematic triggers');
            console.log('SELECT * FROM information_schema.triggers WHERE event_object_table = \'user_subscriptions\';');
            console.log('');
            console.log('-- If needed, recreate the table with proper constraints');
            console.log('-- (Make sure to backup data first!)');
            console.log('');
            console.log('3. After fixing, re-enable RLS if needed:');
            console.log('ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;');
            
          } else {
            console.log('✅ System table access works:', systemCheck);
            
            if (systemCheck && systemCheck.length > 0) {
              const table = systemCheck[0];
              console.log(`📋 Table info: RLS enabled = ${table.relrowsecurity}`);
              
              if (table.relrowsecurity) {
                console.log('💡 RLS is enabled - this might be causing the constraint issue');
                console.log('🔧 Try disabling RLS temporarily via Supabase Dashboard');
              }
            }
          }
        } else {
          console.log('✅ Raw client insert succeeded!');
          console.log('💡 The issue might be with the default client configuration');
          
          // Clean up test record
          await rawClient
            .from('user_subscriptions')
            .delete()
            .eq('id', testRecord.id);
        }
      } else {
        console.log('✅ Plain insert succeeded!');
        console.log('💡 The issue is specifically with upsert operations');
        
        // Clean up test record
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('id', testRecord.id);
      }
    } else {
      console.log('✅ Upsert with conflict resolution succeeded!');
      console.log('💡 The constraint issue has been resolved');
      
      // Clean up test record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', testRecord.id);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixDatabaseConstraints();

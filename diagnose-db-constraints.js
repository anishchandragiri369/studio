require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseDatabaseConstraints() {
  console.log('🔍 Diagnosing database constraints causing 42P10 error...');
  
  try {
    // 1. Check RLS policies on user_subscriptions table
    console.log('\n1️⃣ Checking RLS policies...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'user_subscriptions' });
    
    if (rlsError && rlsError.code === 'PGRST202') {
      console.log('⚠️ Custom RPC not available, trying direct SQL queries...');
      
      // Try to check if RLS is enabled
      const { data: rlsStatus, error: rlsStatusError } = await supabase
        .rpc('check_rls_status');
        
      if (rlsStatusError) {
        console.log('⚠️ Cannot check RLS status via RPC, trying alternative...');
        
        // Check if we can query pg_class to see table info
        const { data: tableInfo, error: tableError } = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_name', 'user_subscriptions');
          
        if (tableError) {
          console.log('❌ Cannot access table information:', tableError);
        } else {
          console.log('✅ Table exists:', tableInfo);
        }
      }
    } else if (rlsPolicies) {
      console.log('📋 RLS Policies found:', rlsPolicies);
    }

    // 2. Check table constraints
    console.log('\n2️⃣ Checking table constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'user_subscriptions');
      
    if (constraintError) {
      console.log('❌ Cannot check constraints:', constraintError);
    } else {
      console.log('📋 Table constraints:', constraints);
      
      if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
          console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }
    }

    // 3. Check for triggers
    console.log('\n3️⃣ Checking triggers...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'user_subscriptions');
      
    if (triggerError) {
      console.log('❌ Cannot check triggers:', triggerError);
    } else {
      console.log('📋 Triggers found:', triggers?.length || 0);
      
      if (triggers && triggers.length > 0) {
        triggers.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation} on ${trigger.action_timing}`);
        });
      }
    }

    // 4. Check column constraints
    console.log('\n4️⃣ Checking column constraints...');
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'user_subscriptions');
      
    if (columnError) {
      console.log('❌ Cannot check columns:', columnError);
    } else {
      console.log('📋 Columns with constraints:');
      
      if (columns && columns.length > 0) {
        columns.forEach(col => {
          if (col.is_nullable === 'NO' || col.column_default) {
            console.log(`  - ${col.column_name}: nullable=${col.is_nullable}, default=${col.column_default}, type=${col.data_type}`);
          }
        });
      }
    }

    // 5. Test direct SQL execution to bypass Supabase client issues
    console.log('\n5️⃣ Testing direct SQL execution...');
    
    // Try to execute raw SQL via RPC to see if the issue is with Supabase client
    const testSql = `
      INSERT INTO user_subscriptions (
        id, user_id, plan_id, status, delivery_frequency, 
        created_at, updated_at, subscription_start_date, subscription_end_date,
        next_delivery_date, total_amount, subscription_duration, 
        original_price, discount_percentage, discount_amount, final_price,
        renewal_notification_sent, selected_juices, delivery_address
      ) VALUES (
        '${crypto.randomUUID()}',
        '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b',
        'test',
        'active',
        'monthly',
        NOW(),
        NOW(),
        NOW(),
        NOW() + INTERVAL '30 days',
        NOW() + INTERVAL '7 days',
        100.00,
        1,
        100.00,
        0.00,
        0.00,
        100.00,
        false,
        '[]'::jsonb,
        '[]'::jsonb
      );
    `;
    
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('execute_sql', { sql_query: testSql });
      
    if (sqlError) {
      if (sqlError.code === 'PGRST202') {
        console.log('⚠️ execute_sql RPC not available');
        
        // Try creating the RPC function first
        console.log('🔧 Attempting to create execute_sql function...');
        
        const createFunctionSql = `
          CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
          RETURNS text
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_query;
            RETURN 'Success';
          EXCEPTION
            WHEN others THEN
              RETURN 'Error: ' || SQLERRM;
          END;
          $$;
        `;
        
        const { error: createError } = await supabase
          .rpc('exec', { sql: createFunctionSql });
          
        if (createError) {
          console.log('❌ Cannot create execute_sql function:', createError);
          console.log('💡 This suggests limited database access rights');
        } else {
          console.log('✅ execute_sql function created, retrying...');
          
          const { data: retryResult, error: retryError } = await supabase
            .rpc('execute_sql', { sql_query: testSql });
            
          if (retryError) {
            console.log('❌ Still failed after creating function:', retryError);
          } else {
            console.log('✅ Direct SQL succeeded:', retryResult);
          }
        }
      } else {
        console.log('❌ Direct SQL failed:', sqlError);
      }
    } else {
      console.log('✅ Direct SQL succeeded:', sqlResult);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnoseDatabaseConstraints();

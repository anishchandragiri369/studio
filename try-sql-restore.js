require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function tryDirectSQLRestore() {
  console.log('🔧 Attempting to restore subscriptions via direct SQL approach...');
  
  try {
    const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
    
    // Try using a very simple approach first - just create one subscription
    const subscription = {
      id: '430a6f54-88a4-434d-a6ad-904c1ce37f60', // Use the original ID
      user_id: userId,
      plan_id: 'sub1',
      status: 'active',
      delivery_frequency: 'monthly',
      created_at: '2025-06-24T17:56:55.516+00:00',
      updated_at: new Date().toISOString(),
      subscription_start_date: '2025-06-24T17:56:55.516+00:00',
      subscription_end_date: '2025-08-24T17:56:55.516+00:00',
      next_delivery_date: '2025-07-10T10:00:00+00:00', // Required field
      total_amount: 219.98,
      subscription_duration: 2,
      original_price: 219.98,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: 219.98,
      selected_juices: [
        { name: 'Orange Juice', quantity: 2 },
        { name: 'Apple Juice', quantity: 1 },
        { name: 'Grape Juice', quantity: 1 }
      ],
      delivery_address: [
        {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          zip: '12345'
        }
      ],
      renewal_notification_sent: false
    };
    
    // Try different client configurations
    const clients = [
      // Default client
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      
      // Client with different options
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          db: { schema: 'public' },
          auth: { persistSession: false }
        }
      )
    ];
    
    for (let i = 0; i < clients.length; i++) {
      console.log(`🧪 Trying client configuration ${i + 1}...`);
      
      const { data, error } = await clients[i]
        .from('user_subscriptions')
        .insert(subscription);
        
      if (error) {
        console.error(`❌ Client ${i + 1} failed:`, error);
      } else {
        console.log(`✅ Client ${i + 1} succeeded!`);
        break;
      }
    }
    
    // If all clients failed, try creating a minimal subscription record
    console.log('\n🔬 Trying absolute minimal record...');
    
    const minimalSubscription = {
      id: crypto.randomUUID(),
      user_id: userId,
      plan_id: 'minimal',
      status: 'active',
      delivery_frequency: 'monthly',
      next_delivery_date: '2025-07-10T10:00:00+00:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      total_amount: 100,
      subscription_duration: 1,
      original_price: 100,
      discount_percentage: 0,
      discount_amount: 0,
      final_price: 100,
      renewal_notification_sent: false
    };
    
    const { data: minimalData, error: minimalError } = await supabase
      .from('user_subscriptions')
      .insert(minimalSubscription);
      
    if (minimalError) {
      console.error('❌ Even minimal record failed:', minimalError);
      
      // As a last resort, let's see if we can at least check the table structure
      console.log('\n🔍 Checking what we can do...');
      
      // Try to at least verify the table exists and we can read from it
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error('❌ Cannot even read from table:', tableError);
        console.log('💡 This suggests a fundamental database access issue');
      } else {
        console.log('✅ Can read from table, but cannot write to it');
        console.log('💡 This is likely a database configuration issue that requires admin intervention');
      }
    } else {
      console.log('✅ Minimal record insertion succeeded!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

tryDirectSQLRestore();

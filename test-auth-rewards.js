const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithAuth() {
  console.log('🔍 Testing Rewards with Authentication...\n');

  const userEmail = 'bobby.ani209@gmail.com';
  const userId = '8967ff0e-2f67-47fa-8b2f-4fa7e945c14b';
  
  try {
    console.log('1. Testing without authentication (current state)...');
    
    const { data: rewardsUnauth, error: rewardsUnauthError } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId);

    console.log('Unauth rewards result:', rewardsUnauth);
    console.log('Unauth rewards error:', rewardsUnauthError);

    // For the frontend to work, the rewards data needs to be accessible either:
    // 1. With proper authentication (user signed in)
    // 2. With relaxed RLS policies
    // 3. Through API endpoints that use service role

    console.log('\n2. The issue is that RLS policies require user authentication.');
    console.log('The frontend works when the user is signed in through the auth system.');
    console.log('Let\'s check if the API endpoints use the service role properly...');

    // Let's check the API route files to see how they handle authentication
    console.log('\n3. Solution options:');
    console.log('A) Make sure the frontend user is properly authenticated');
    console.log('B) Use API endpoints that bypass RLS with service role');
    console.log('C) Adjust RLS policies to be more permissive');

    // Since we can't easily simulate auth here, let's test the approach used by the API
    console.log('\n4. Testing service role approach...');
    
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      console.log('✅ Service role key is available');
      
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: adminRewards, error: adminError } = await adminClient
        .from('user_rewards')
        .select('*')
        .eq('user_id', userId);

      if (adminError) {
        console.error('❌ Admin client error:', adminError);
      } else {
        console.log('✅ Admin client success:', adminRewards);
      }
    } else {
      console.log('❌ Service role key not available in environment');
      console.log('This means the API endpoints might not be working properly');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWithAuth();

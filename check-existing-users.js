require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingUsers() {
  console.log('🔍 Checking existing users and their database status');
  console.log('===================================================\n');
  
  try {
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    console.log(`Found ${authUsers.users.length} users in auth system\n`);

    for (const user of authUsers.users.slice(0, 5)) { // Check first 5 users
      console.log(`User: ${user.email} (${user.id})`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`  Provider: ${user.app_metadata?.provider || 'email'}`);
      
      // Check if user exists in our rewards database
      const userExistsResponse = await fetch('http://localhost:3000/api/rewards/user/' + user.id);
      const userExistsResult = await userExistsResponse.json();
      
      console.log(`  In our DB: ${userExistsResult.success ? 'YES' : 'NO'}`);
      
      if (!userExistsResult.success) {
        console.log(`  ⚠️  This user exists in auth but NOT in our database!`);
      }
      
      console.log(''); // Empty line for readability
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingUsers();

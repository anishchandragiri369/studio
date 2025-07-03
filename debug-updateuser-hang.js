const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Debug UpdateUser Hang ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUpdateUserHang() {
  try {
    console.log('\n--- Step 1: Testing Supabase connection ---');
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Health check failed:', healthError.message);
    } else {
      console.log('✅ Basic Supabase connection works');
    }

    console.log('\n--- Step 2: Testing auth.getSession() ---');
    
    // Check current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('Session status:', sessionData.session ? 'Active' : 'No active session');
      if (sessionData.session) {
        console.log('User ID:', sessionData.session.user?.id);
        console.log('User email:', sessionData.session.user?.email);
      }
    }

    console.log('\n--- Step 3: Testing updateUser with timeout ---');
    
    // Test updateUser with a timeout to see if it's hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('updateUser call timed out after 10 seconds')), 10000)
    );
    
    const updatePromise = supabase.auth.updateUser({ 
      password: 'testpassword123' 
    });
    
    try {
      const { data, error } = await Promise.race([updatePromise, timeoutPromise]);
      
      if (error) {
        console.log('❌ UpdateUser error:', error.message);
        console.log('Error details:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ UpdateUser successful:', data);
      }
    } catch (timeoutError) {
      console.log('❌ UpdateUser hung/timed out:', timeoutError.message);
      
      // Try to cancel the hanging request
      console.log('Attempting to check what might be blocking...');
      
      // Check if there's a network issue
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({ password: 'testpassword123' })
        });
        
        console.log('Direct fetch response status:', response.status);
        const responseText = await response.text();
        console.log('Direct fetch response:', responseText);
      } catch (fetchError) {
        console.log('❌ Direct fetch also failed:', fetchError.message);
      }
    }

    console.log('\n--- Step 4: Testing updateUser without password (metadata update) ---');
    
    try {
      const metadataUpdate = await Promise.race([
        supabase.auth.updateUser({ 
          data: { test_timestamp: Date.now() }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metadata update timed out')), 5000)
        )
      ]);
      
      if (metadataUpdate.error) {
        console.log('❌ Metadata update error:', metadataUpdate.error.message);
      } else {
        console.log('✅ Metadata update successful');
      }
    } catch (timeoutError) {
      console.log('❌ Metadata update also timed out');
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

// Run the debug
debugUpdateUserHang().then(() => {
  console.log('\n=== Debug Complete ===');
  process.exit(0);
}).catch(error => {
  console.error('Debug script failed:', error);
  process.exit(1);
});

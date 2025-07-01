// Get a valid user ID from the database for testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rvdrtpyssyqardgxtdie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHJ0cHlzc3lxYXJkZ3h0ZGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzNDc0NDUsImV4cCI6MjA0MTkyMzQ0NX0.vwEVGRnfDGEDq9WZrCbD7_fHwrZSbN_9vS1kHWKyRYQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getValidUserId() {
  try {
    // Try to get any user from the profiles/users table
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('Error getting users from profiles:', error);
      
      // Try auth.users if profiles doesn't work
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.log('Error getting auth users:', authError);
        return null;
      }
      
      if (authUsers.users && authUsers.users.length > 0) {
        console.log('Found user ID from auth:', authUsers.users[0].id);
        return authUsers.users[0].id;
      }
    }
    
    if (users && users.length > 0) {
      console.log('Found user ID from profiles:', users[0].id);
      return users[0].id;
    }
    
    console.log('No users found');
    return null;
  } catch (error) {
    console.error('Script error:', error);
    return null;
  }
}

getValidUserId();

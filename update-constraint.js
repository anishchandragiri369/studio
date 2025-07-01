const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rvdrtpyssyqardgxtdie.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHJ0cHlzc3lxYXJkZ3h0ZGllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjM0NzQ0NSwiZXhwIjoyMDQxOTIzNDQ1fQ.S5qeCdGZJ9SQmQXG_Qr4NqojE1TDKmnAHtaMNJXFdXA'; // Service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateConstraint() {
  try {
    console.log('Updating subscription duration constraint...');
    
    // Drop existing constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_duration_check;'
    });
    
    if (dropError) {
      console.log('Drop constraint result:', dropError);
    } else {
      console.log('✅ Dropped existing constraint');
    }
    
    // Add new constraint
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_subscription_duration_check CHECK (subscription_duration >= 1 AND subscription_duration <= 12);'
    });
    
    if (addError) {
      console.log('❌ Error adding new constraint:', addError);
    } else {
      console.log('✅ Added new constraint allowing 1-12 months');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

updateConstraint();

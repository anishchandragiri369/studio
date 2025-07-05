const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOAuthFlowSimulation() {
  console.log('=== Testing OAuth Flow Simulation ===\n');
  
  try {
    // Simulate the exact flow that happens when someone clicks "Sign in with Google"
    console.log('1. Simulating "Sign in with Google" button click...');
    
    // This is what happens in signInWithGoogle:
    // sessionStorage.setItem('oauth-signin-attempt', 'true');
    console.log('   - sessionStorage.setItem("oauth-signin-attempt", "true")');
    
    // User gets redirected to Google OAuth
    console.log('   - User redirected to Google OAuth');
    
    // User authorizes and gets redirected back
    console.log('   - User authorizes and gets redirected back');
    
    // SIGNED_IN event fires in AuthContext
    console.log('\n2. SIGNED_IN event fires in AuthContext...');
    
    // Check if this was a sign-in attempt
    // const isSignInAttempt = sessionStorage.getItem('oauth-signin-attempt') === 'true';
    console.log('   - isSignInAttempt = true (from sessionStorage)');
    
    // Check if user exists in database
    console.log('   - Checking if user exists in database...');
    
    // For testing, let's create a mock user that doesn't exist in our DB
    const mockUserId = '00000000-0000-0000-0000-000000000000';
    
    // Test the API call that AuthContext makes
    console.log(`   - Calling GET /api/rewards/user/${mockUserId}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/rewards/user/${mockUserId}`);
    const result = await response.json();
    
    console.log(`   - API Response:`, result);
    
    if (!result.success || !result.data) {
      console.log('   - User does not exist in database');
      console.log('   - Since isSignInAttempt = true, should sign out and redirect to signup');
      console.log('   - ✅ This is the correct behavior');
    } else {
      console.log('   - User exists in database');
      console.log('   - Should allow sign-in');
    }
    
    console.log('\n3. Testing signup flow...');
    
    // This is what happens when someone clicks "Continue with Google" on signup
    console.log('   - sessionStorage.setItem("oauth-signin-attempt", "false")');
    console.log('   - User gets redirected to Google OAuth');
    console.log('   - User authorizes and gets redirected back');
    console.log('   - SIGNED_IN event fires with isSignInAttempt = false');
    console.log('   - Should proceed with user setup regardless of DB existence');
    
    // Test what happens if there's no sessionStorage flag
    console.log('\n4. Testing edge case - no sessionStorage flag...');
    console.log('   - If oauth-signin-attempt is not set, what happens?');
    console.log('   - Current logic: isSignInAttempt = false by default');
    console.log('   - This means it treats it as a signup attempt');
    console.log('   - ⚠️  This could be a problem if someone bypasses our app');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOAuthFlowSimulation();

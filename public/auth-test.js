/**
 * Test utility to verify logout functionality and session cleanup
 * Run this in browser console after logging in to test session cleanup
 */

// Test function to check current auth state
window.testAuthState = function() {
  console.log('=== AUTH STATE TEST ===');
  
  // Check localStorage for auth-related items
  console.log('LocalStorage auth items:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
      console.log(`  ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }
  }
  
  // Check sessionStorage
  console.log('SessionStorage length:', sessionStorage.length);
  
  // Check cookies
  console.log('Auth-related cookies:');
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
      console.log(`  ${name}: ${cookie.split('=')[1]?.substring(0, 50)}...`);
    }
  });
  
  console.log('=== END AUTH STATE TEST ===');
};

// Test function to simulate logout and verify cleanup
window.testLogout = async function() {
  console.log('=== LOGOUT TEST ===');
  
  // Check state before logout
  console.log('State before logout:');
  window.testAuthState();
  
  // Simulate logout (this would be called by the actual logout button)
  try {
    // Import auth utils (this would work in actual app context)
    const { clearAuthSession } = await import('/src/lib/authUtils.ts');
    clearAuthSession();
    
    console.log('Logout cleanup completed');
    
    // Check state after logout
    console.log('State after logout:');
    window.testAuthState();
    
  } catch (error) {
    console.error('Error testing logout:', error);
  }
  
  console.log('=== END LOGOUT TEST ===');
};

console.log('Auth test utilities loaded. Use window.testAuthState() or window.testLogout() to test.');

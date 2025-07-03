// Immediate OAuth token cleanup script
// This runs as soon as the page loads to handle OAuth tokens in the URL hash

(function() {
  'use strict';
  
  // Only run in browser
  if (typeof window === 'undefined') return;
  
  // Check for OAuth tokens in URL hash
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return;
  
  // Don't clean tokens on the reset password page - let the reset component handle them
  if (window.location.pathname === '/reset-password') {
    console.log('[OAuth Cleanup] OAuth tokens detected on reset password page - skipping cleanup');
    return;
  }
  
  console.log('[OAuth Cleanup] OAuth tokens detected, will be processed by React components');
  
  // Set a flag that React components can check
  window.__oauth_tokens_detected = true;
  
  // Also clean up the URL after a short delay if React components don't handle it
  setTimeout(() => {
    if (window.location.hash.includes('access_token') && window.location.pathname !== '/reset-password') {
      console.log('[OAuth Cleanup] Cleaning up URL hash as fallback');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, 3000); // 3 second fallback
})();

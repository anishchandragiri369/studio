"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/**
 * OAuth Token Handler Component
 * This component automatically detects and handles OAuth tokens in the URL hash
 * It should be included in the root layout to work on any page
 */
export default function OAuthTokenHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleOAuthTokens = async () => {
      // Only run on client side
      if (typeof window === 'undefined' || !supabase) return;

      // Check if there are OAuth tokens in the hash
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) return;

      // Don't handle tokens on the reset password page - let the reset component handle them
      if (window.location.pathname === '/reset-password') {
        console.log('[OAuthTokenHandler] OAuth tokens detected on reset password page - skipping handling');
        return;
      }

      console.log('[OAuthTokenHandler] OAuth tokens detected in URL');

      try {
        // Let Supabase handle the hash automatically
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[OAuthTokenHandler] Error getting session after OAuth:', error);
          
          // Fallback: manually parse and set tokens
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[OAuthTokenHandler] Manually setting session with tokens');
            
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error('[OAuthTokenHandler] Error setting session manually:', sessionError);
              return;
            }

            if (sessionData.user) {
              console.log('[OAuthTokenHandler] Session set successfully (manual)');
              cleanupAndRedirect();
            }
          }
          return;
        }

        if (data.session?.user) {
          console.log('[OAuthTokenHandler] Session found, cleaning up URL');
          cleanupAndRedirect();
        }

      } catch (error) {
        console.error('[OAuthTokenHandler] Error handling OAuth tokens:', error);
      }
    };

    const cleanupAndRedirect = () => {
      // Clear the hash from URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Get return URL and clean it up
      const returnUrl = sessionStorage.getItem('oauth-return-url') || '/';
      sessionStorage.removeItem('oauth-return-url');
      
      console.log('[OAuthTokenHandler] Redirecting to:', returnUrl);
      
      // If we're not already on the target page, redirect
      if (returnUrl !== window.location.pathname) {
        router.push(returnUrl);
      }
    };

    // Run immediately
    handleOAuthTokens();

    // Also listen for hash changes (in case the component loads after the hash is set)
    const handleHashChange = () => {
      handleOAuthTokens();
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}

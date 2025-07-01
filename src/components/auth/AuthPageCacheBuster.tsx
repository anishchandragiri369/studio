"use client";

import { useEffect } from 'react';

/**
 * AuthPageCacheBuster - Specific cache control for auth pages
 * Prevents caching of login/signup/reset-password pages only
 */
export default function AuthPageCacheBuster() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add cache control meta tags specifically for auth pages
    const addNoCacheMetaTags = () => {
      // Check if meta tags already exist
      if (document.querySelector('meta[http-equiv="Cache-Control"]')) return;

      const cacheControl = document.createElement('meta');
      cacheControl.setAttribute('http-equiv', 'Cache-Control');
      cacheControl.setAttribute('content', 'no-cache, no-store, must-revalidate');
      document.head.appendChild(cacheControl);

      const pragma = document.createElement('meta');
      pragma.setAttribute('http-equiv', 'Pragma');
      pragma.setAttribute('content', 'no-cache');
      document.head.appendChild(pragma);

      const expires = document.createElement('meta');
      expires.setAttribute('http-equiv', 'Expires');
      expires.setAttribute('content', '0');
      document.head.appendChild(expires);
    };

    addNoCacheMetaTags();

    // Clean up any stale auth data on auth pages
    const cleanStaleAuthData = () => {
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-') || key.includes('auth')
        );
        
        authKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              
              // Check if token is expired
              if (parsed.expires_at) {
                const expiryTime = parsed.expires_at * 1000;
                if (Date.now() > expiryTime) {
                  console.log('[AuthPageCacheBuster] Removing expired auth token');
                  localStorage.removeItem(key);
                }
              }
            }
          } catch (e) {
            // Remove corrupted auth data
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('[AuthPageCacheBuster] Error cleaning auth data:', error);
      }
    };

    cleanStaleAuthData();
  }, []);

  return null;
}

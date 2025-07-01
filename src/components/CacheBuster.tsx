"use client";

import { useEffect, useRef } from 'react';

/**
 * CacheBuster component to handle browser cache issues
 * Less aggressive approach to prevent reload loops
 */
export default function CacheBuster() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent multiple runs in the same session
    if (hasRunRef.current || typeof window === 'undefined') return;
    hasRunRef.current = true;

    // Only run cache busting logic, no automatic reloads
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || 
                          process.env.NEXT_PUBLIC_BUILD_TIME || 
                          '1.0.0';
    
    const storedVersion = localStorage.getItem('elixr_app_version');
    
    // Just update the version without aggressive clearing
    if (!storedVersion || storedVersion !== currentVersion) {
      console.log('[CacheBuster] Version updated from', storedVersion, 'to', currentVersion);
      localStorage.setItem('elixr_app_version', currentVersion);
    }

    // Only clean up obviously expired auth tokens
    const cleanExpiredTokens = () => {
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') && key.includes('auth-token')
        );
        
        authKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              
              // Only remove if clearly expired (with some buffer)
              if (parsed.expires_at) {
                const expiryTime = parsed.expires_at * 1000;
                const bufferTime = 5 * 60 * 1000; // 5 minute buffer
                if (Date.now() > (expiryTime + bufferTime)) {
                  console.log('[CacheBuster] Removing expired auth token:', key);
                  localStorage.removeItem(key);
                }
              }
            }
          } catch (e) {
            // Only remove if completely unparseable
            console.warn('[CacheBuster] Removing corrupted auth data:', key);
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('[CacheBuster] Error checking auth tokens:', error);
      }
    };

    // Run token cleanup periodically but not aggressively
    cleanExpiredTokens();
    const interval = setInterval(cleanExpiredTokens, 10 * 60 * 1000); // Every 10 minutes
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

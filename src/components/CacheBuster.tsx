"use client";

import { useEffect } from 'react';

/**
 * CacheBuster component to handle browser cache issues
 * Forces cache invalidation when app version changes
 */
export default function CacheBuster() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Generate version from build time or use current timestamp
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || 
                          process.env.NEXT_PUBLIC_BUILD_TIME || 
                          '1.0.0';
    
    const storedVersion = localStorage.getItem('elixr_app_version');
    
    // Check if this is the first visit or version has changed
    if (!storedVersion || storedVersion !== currentVersion) {
      console.log('[CacheBuster] Version change detected, clearing browser cache');
      
      try {
        // Clear localStorage but preserve essential items
        const keysToPreserve = ['elixr_app_version'];
        const currentData: Record<string, string> = {};
        
        // Backup keys we want to preserve
        keysToPreserve.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) currentData[key] = value;
        });
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Restore preserved data and set new version
        Object.entries(currentData).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
        localStorage.setItem('elixr_app_version', currentVersion);
        
        // Clear any cached service worker data
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
              registration.unregister();
            });
          });
        }
        
        // Clear browser cache if possible (modern browsers)
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        
        console.log('[CacheBuster] Cache cleared successfully');
      } catch (error) {
        console.warn('[CacheBuster] Error clearing cache:', error);
      }
    }

    // Check for stale auth tokens and clear them
    const checkAuthTokens = () => {
      try {
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || 
          key.includes('sb-') || 
          key.includes('auth')
        );
        
        authKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              
              // Check if token is expired (if it has expiry info)
              if (parsed.expires_at) {
                const expiryTime = parsed.expires_at * 1000; // Convert to milliseconds
                if (Date.now() > expiryTime) {
                  console.log('[CacheBuster] Removing expired auth token:', key);
                  localStorage.removeItem(key);
                }
              }
            }
          } catch (e) {
            // If we can't parse the auth data, it might be corrupted
            console.warn('[CacheBuster] Removing corrupted auth data:', key);
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('[CacheBuster] Error checking auth tokens:', error);
      }
    };

    checkAuthTokens();
    
    // Periodic cleanup every 5 minutes
    const interval = setInterval(checkAuthTokens, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

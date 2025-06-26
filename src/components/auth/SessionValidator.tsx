"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ensureValidAuth } from '@/lib/authUtils';

/**
 * SessionValidator component that validates user sessions on page load/refresh
 * This component should be included in the root layout to ensure session validation
 */
export default function SessionValidator() {
  const { user, loading } = useAuth();
  const hasValidated = useRef(false);

  useEffect(() => {
    const validateUserSession = async () => {
      // Only validate once per session and if we think we have a user
      if (loading || hasValidated.current) {
        return;
      }

      hasValidated.current = true;

      if (user) {
        console.log('[SessionValidator] Validating user session for:', user.email);
        
        const isValid = await ensureValidAuth();
        
        if (!isValid) {
          console.warn('[SessionValidator] Invalid session detected, clearing auth state');
          
          // Force page reload to clear stale state
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        } else {
          console.log('[SessionValidator] Session validation passed');
        }
      } else {
        // If no user but there might be stale auth data, clean it up
        const isValid = await ensureValidAuth();
        if (!isValid) {
          console.log('[SessionValidator] Cleaned up stale auth data');
        }
      }
    };

    // Run validation after auth context loads
    if (!loading) {
      const timer = setTimeout(validateUserSession, 500);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Also validate on focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = async () => {
      if (!loading && user) {
        const isValid = await ensureValidAuth();
        if (!isValid && typeof window !== 'undefined') {
          console.warn('[SessionValidator] Session expired while away, redirecting...');
          window.location.href = '/';
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading]);

  // This component doesn't render anything
  return null;
}

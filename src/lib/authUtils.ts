// Authentication utilities for session management and validation

import { supabase, isSupabaseConfigured } from './supabaseClient';

/**
 * Validates the current user session
 * Returns true if session is valid, false otherwise
 */
export async function validateSession(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[authUtils] Supabase not configured, cannot validate session');
    return false;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[authUtils] Error validating session:', error);
      return false;
    }

    if (!session || !session.user) {
      console.log('[authUtils] No valid session found');
      return false;
    }

    // Check if session is expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.log('[authUtils] Session expired');
      await clearAuthSession();
      return false;
    }

    console.log('[authUtils] Valid session found for user:', session.user.email);
    return true;
  } catch (error) {
    console.error('[authUtils] Error during session validation:', error);
    return false;
  }
}

/**
 * Clears all authentication-related data from browser storage
 */
export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  console.log('[authUtils] Clearing authentication session...');

  try {
    // Clear localStorage items related to auth
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('[authUtils] Removed localStorage key:', key);
    });

    // Clear sessionStorage completely
    sessionStorage.clear();
    console.log('[authUtils] Cleared sessionStorage');

    // Clear cookies that might contain session data
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        console.log('[authUtils] Cleared cookie:', name);
      }
    });

    console.log('[authUtils] Authentication session cleared successfully');
  } catch (error) {
    console.error('[authUtils] Error clearing auth session:', error);
  }
}

/**
 * Refreshes the current session if needed
 */
export async function refreshSession(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[authUtils] Error refreshing session:', error);
      await clearAuthSession();
      return false;
    }

    if (data.session) {
      console.log('[authUtils] Session refreshed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[authUtils] Error during session refresh:', error);
    return false;
  }
}

/**
 * Checks if user is authenticated and session is valid
 * If not, clears any stale auth data
 */
export async function ensureValidAuth(): Promise<boolean> {
  const isValid = await validateSession();
  
  if (!isValid) {
    clearAuthSession();
  }

  return isValid;
}

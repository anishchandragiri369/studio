"use client";

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import type { User, AuthError as SupabaseAuthError, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { SignUpFormData, LoginFormData, ForgotPasswordFormData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (data: SignUpFormData) => Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
  logIn: (data: LoginFormData) => Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<{ error: SupabaseAuthError | null } | { code: string; message: string }>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED_ERROR_PAYLOAD = { 
  code: 'supabase/not-configured', 
  message: 'Supabase client is not configured correctly. Authentication features are disabled. Please check your .env file and verify Supabase initialization.' 
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isActuallyConfiguredAndAuthReady = isSupabaseConfigured && supabase !== null;
  useEffect(() => {
    if (!isActuallyConfiguredAndAuthReady) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Get initial session on load
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
          
          // Handle specific refresh token errors
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token') ||
              error.message?.includes('JWT expired')) {
            
            // Clear local auth state without triggering a server-side sign out
            await supabase!.auth.signOut({ scope: 'local' });
            
            // Clean up any stale localStorage entries
            if (typeof window !== 'undefined') {
              const authKeys = Object.keys(localStorage).filter(key => 
                key.includes('supabase') || key.includes('auth')
              );
              authKeys.forEach(key => {
                try {
                  localStorage.removeItem(key);
                } catch (cleanupError) {
                  console.warn('[AuthContext] Failed to remove localStorage key:', key);
                }
              });
            }
          }
          
          setUser(null);
          setIsAdmin(false);
        } else if (session?.user) {
          setUser(session.user);
          
          try {
            // Query the 'admins' table for this email
            // Don't use .single() to avoid 406 errors when user is not an admin
            const { data: adminData, error: adminError } = await supabase!
              .from('admins')
              .select('email')
              .eq('email', session.user.email);
            
            // Check if user is admin (data array has results and no error)
            const isUserAdmin = !adminError && adminData && adminData.length > 0;
            setIsAdmin(isUserAdmin);
          } catch (adminCheckError) {
            console.error('[AuthContext] Error checking initial admin status:', adminCheckError);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error checking initial session:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
      // Handle specific auth events
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        
        // Additional cleanup for signed out state
        if (typeof window !== 'undefined') {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('auth'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('[AuthContext] Failed to remove localStorage key:', key);
            }
          });
        }
        
        return; // Early return for SIGNED_OUT
      }
      
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        try {
          // Query the 'admins' table for this email
          // Don't use .single() to avoid 406 errors when user is not an admin
          const { data: adminData, error: adminError } = await supabase!
            .from('admins')
            .select('email')
            .eq('email', currentUser.email);
          
          // Check if user is admin (data array has results and no error)
          const isUserAdmin = !adminError && adminData && adminData.length > 0;
          setIsAdmin(isUserAdmin);
        } catch (error) {
          console.error('[AuthContext] Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [isActuallyConfiguredAndAuthReady]);

  const signUp = async (credentials: SignUpFormData): Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string, message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    
    try {
      const { data, error } = await supabase!.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      // Even if data.user exists, an error might be present if email confirmation is required but something else went wrong.
      // Or if data.user is null but error is also null (edge case, but good to be defensive).
      if (error) return { data: null, error };
      if (!data.user && !error) return {data: null, error: {name: "SignUpNoUserError", message: "Sign up did not return a user and no error."} as SupabaseAuthError}
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (e: any) {
      return { data: null, error: { name: 'SignUpUnexpectedError', message: e.message || "An unexpected error occurred during sign up." } as SupabaseAuthError };
    }
  };

  const logIn = async (credentials: LoginFormData): Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string, message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) return { data: null, error };
      if (!data.user && !error) return {data: null, error: {name: "LoginNoUserError", message: "Login did not return a user and no error."} as SupabaseAuthError}
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (e: any) {
      return { data: null, error: { name: 'LoginUnexpectedError', message: e.message || "An unexpected error occurred during login." } as SupabaseAuthError };
    }
  };
  const logOut = async (): Promise<void> => {    if (!isActuallyConfiguredAndAuthReady) {
      setUser(null);
      setIsAdmin(false);
      // Clear any remaining localStorage items
      if (typeof window !== 'undefined') {
        // Clear localStorage items that might contain auth data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('auth'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
      }
      return Promise.resolve();
    }
    
    try {
      // Sign out from Supabase
      const { error } = await supabase!.auth.signOut();
        // Clear local state immediately
      setUser(null);
      setIsAdmin(false);
      
      // Clear any remaining session data from browser storage
      if (typeof window !== 'undefined') {
        // Clear localStorage items that might contain auth data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('auth'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage completely
        sessionStorage.clear();
        
        // Clear any cookies that might contain session data
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          if (name.trim().includes('supabase') || name.trim().includes('auth')) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          }
        });
      }
      
      if (error) {
        // Continue with cleanup even if signOut had an error
      }
    } catch (error) {
      // Even if there's an error, clear local state
      setUser(null);
      setIsAdmin(false);
    }
  };

  const sendPasswordReset = async (data: ForgotPasswordFormData): Promise<{ error: SupabaseAuthError | null } | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;

    const { error } = await supabase!.auth.resetPasswordForEmail(data.email, {
      redirectTo, 
    });
    if (error) return { error };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user, 
      loading, 
      isAdmin,
      signUp, 
      logIn, 
      logOut, 
      sendPasswordReset, 
      isSupabaseConfigured: isActuallyConfiguredAndAuthReady
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

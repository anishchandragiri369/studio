
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

// Define a constant for the admin email for easy modification
const ADMIN_EMAILS = ['admin@elixr.com', 'anishchandragiri@gmail.com', 'keerthy.chandragiri@gmail.com'];

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
      console.warn("AuthContext: Supabase Auth is not available or not properly configured. Authentication features will be disabled.");
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
          setUser(null);
          setIsAdmin(false);
        } else if (session?.user) {
          console.log('[AuthContext] Initial session found for user:', session.user.email);
          setUser(session.user);
          setIsAdmin(session.user.email ? ADMIN_EMAILS.includes(session.user.email) : false);
        } else {
          console.log('[AuthContext] No initial session found');
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
      console.log('[AuthContext] Auth state changed:', event, session?.user?.email || 'no user');
      
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser && currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      // If the event is SIGNED_OUT, ensure complete cleanup
      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] Processing SIGNED_OUT event');
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
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      }
      
      if (!loading) {
        setLoading(false);
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [isActuallyConfiguredAndAuthReady, loading]);

  const signUp = async (credentials: SignUpFormData): Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }> => {
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

  const logIn = async (credentials: LoginFormData): Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }> => {
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
      console.log('[AuthContext] Starting logout process...');
      
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
      
      console.log('[AuthContext] Logout completed successfully');
      
      if (error) {
        console.warn('[AuthContext] Supabase signOut error (but continuing with cleanup):', error);
      }
    } catch (error) {
      console.error('[AuthContext] Error during logout:', error);
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

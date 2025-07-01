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
  signInWithGoogle: () => Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
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
  
  // Helper function for immediate state cleanup
  const clearAuthState = () => {
    setUser(null);
    setIsAdmin(false);
  };
  useEffect(() => {
    if (!isActuallyConfiguredAndAuthReady) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Handle OAuth tokens in URL hash immediately
    const handleOAuthHash = async () => {
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        console.log('[AuthContext] OAuth tokens detected in URL hash');
        
        // Clean URL immediately
        const cleanUrl = () => {
          console.log('[AuthContext] Cleaning OAuth hash from URL');
          window.history.replaceState({}, document.title, window.location.pathname);
        };
        
        // Try multiple approaches to ensure URL gets cleaned
        cleanUrl(); // Immediate
        setTimeout(cleanUrl, 100); // Quick fallback
        setTimeout(cleanUrl, 500); // Medium fallback  
        setTimeout(cleanUrl, 1000); // Final fallback
      }
    };

    handleOAuthHash();

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
      console.log('[AuthContext] Auth state change:', event);
      
      // Handle specific auth events
      if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully
      } else if (event === 'SIGNED_IN') {
        // User signed in - clean up OAuth hash if present
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          console.log('[AuthContext] User signed in via OAuth, cleaning URL');
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Handle return URL for OAuth
          const returnUrl = sessionStorage.getItem('oauth-return-url');
          if (returnUrl && returnUrl !== window.location.pathname) {
            sessionStorage.removeItem('oauth-return-url');
            console.log('[AuthContext] Redirecting to return URL:', returnUrl);
            window.location.href = returnUrl;
            return;
          }
        }
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
        
        // Additional cleanup for signed out state
        if (typeof window !== 'undefined') {
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
          );
          authKeys.forEach(key => {
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

  const signInWithGoogle = async (): Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string, message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);

    try {
      // Store current page for return after OAuth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth-return-url', window.location.pathname);
      }

      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });
      
      if (error) return { data: null, error };
      
      // For OAuth, the user will be redirected to Google and then back to our app
      // The actual user data will be available after the redirect
      return { data: null, error: null };
    } catch (e: any) {
      return { data: null, error: { name: 'GoogleSignInError', message: e.message || "An unexpected error occurred during Google sign in." } as SupabaseAuthError };
    }
  };
  const logOut = async (): Promise<void> => {
    // Clear local state immediately for instant UI feedback
    clearAuthState();
    
    // Helper function to clear storage asynchronously
    const clearStorage = () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Use a more efficient approach to clear Supabase auth data
        const authKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
        );
        authKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('[AuthContext] Failed to remove localStorage key:', key);
          }
        });
        
        // Clear sessionStorage
        sessionStorage.clear();
      } catch (e) {
        console.warn('[AuthContext] Error during storage cleanup:', e);
      }
    };

    if (!isActuallyConfiguredAndAuthReady) {
      clearStorage();
      return;
    }
    
    try {
      // Start storage cleanup in parallel with Supabase signOut
      clearStorage();
      
      // Sign out from Supabase - don't await if it takes too long
      const signOutPromise = supabase!.auth.signOut();
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('[AuthContext] SignOut timeout - proceeding with local cleanup');
          resolve();
        }, 2000); // Reduced to 2 second timeout for faster logout
      });
      
      // Race between signOut and timeout
      await Promise.race([signOutPromise, timeoutPromise]);
      
    } catch (error) {
      console.warn('[AuthContext] Error during signOut:', error);
      // Continue - local state is already cleared
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
      signInWithGoogle,
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

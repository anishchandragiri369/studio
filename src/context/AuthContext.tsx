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
import AuthEmailService from '@/lib/auth-email-service';
import GoogleAuthService from '@/lib/google-auth-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (data: SignUpFormData) => Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
  logIn: (data: LoginFormData) => Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<{ error: SupabaseAuthError | null } | { code: string; message: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
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
      // Check if custom auth emails are enabled
      const useCustomEmails = process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS === 'true';
      
      if (useCustomEmails) {
        // Use our custom signup endpoint that has full control over email sending
        console.log('[AuthContext] Using custom signup flow for:', credentials.email);
        
        const customSignupResponse = await fetch('/api/auth/custom-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: credentials.email,
            password: credentials.password,
            name: credentials.email.split('@')[0]
          }),
        });
        
        let customSignupResult;
        try {
          customSignupResult = await customSignupResponse.json();
        } catch (parseError) {
          console.error('[AuthContext] Failed to parse signup response:', parseError);
          customSignupResult = { error: 'Failed to process server response', code: 'ParseError' };
        }

        if (!customSignupResponse.ok) {
          console.error('[AuthContext] Custom signup failed:', {
            status: customSignupResponse.status,
            statusText: customSignupResponse.statusText,
            body: customSignupResult,
          });

          // Debug: Log the exact body content
          console.log('[AuthContext] Response body details:', JSON.stringify(customSignupResult, null, 2));

          // Ensure we have a proper error message
          const errorMessage = customSignupResult?.error || customSignupResult?.message || 'Custom signup failed';
          const errorCode = customSignupResult?.code || 'CustomSignupError';

          return {
            data: null,
            error: {
              name: errorCode,
              message: errorMessage,
            } as SupabaseAuthError,
          };
        }
        
        console.log('[AuthContext] Custom signup successful:', customSignupResult.user.email);
        
        // Return success without session (user needs to activate first)
        return { 
          data: { 
            user: {
              id: customSignupResult.user.id,
              email: customSignupResult.user.email,
              email_confirmed_at: customSignupResult.user.email_confirmed_at
            } as User, 
            session: null 
          }, 
          error: null 
        };
      } else {
        // Fall back to standard Supabase signup for non-custom email flows
        const { data, error } = await supabase!.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        
        if (error) {
          console.log('[AuthContext] Standard signup error:', error);
          return { data: null, error };
        }
        
        if (!data.user && !error) return {data: null, error: {name: "SignUpNoUserError", message: "Sign up did not return a user and no error."} as SupabaseAuthError}
        
        return { data: { user: data.user, session: data.session }, error: null };
      }
    } catch (e: any) {
      console.error('[AuthContext] Signup error:', e);
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
  const logOut = async (): Promise<void> => {
    console.log('[AuthContext] Starting logout process...');
    
    // Immediately clear local state for faster UI response
    setUser(null);
    setIsAdmin(false);
    
    if (!isActuallyConfiguredAndAuthReady) {
      // Clear any remaining localStorage items
      if (typeof window !== 'undefined') {
        try {
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
        } catch (error) {
          console.warn('[AuthContext] Error clearing storage:', error);
        }
      }
      return Promise.resolve();
    }
    
    try {
      // Clear browser storage immediately (don't wait for Supabase)
      if (typeof window !== 'undefined') {
        try {
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
        } catch (storageError) {
          console.warn('[AuthContext] Error clearing storage:', storageError);
        }
      }
      
      // Sign out from Supabase (non-blocking - do this in background)
      supabase!.auth.signOut().then(({ error }) => {
        if (error) {
          console.warn('[AuthContext] Supabase signOut error (non-critical):', error);
        } else {
          console.log('[AuthContext] Supabase signOut successful');
        }
      }).catch((error) => {
        console.warn('[AuthContext] Supabase signOut failed (non-critical):', error);
      });
      
      console.log('[AuthContext] Logout completed');
      
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Even if there's an error, state is already cleared
    }
  };

  const sendPasswordReset = async (data: ForgotPasswordFormData): Promise<{ error: SupabaseAuthError | null } | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    
    try {
      console.log('[AuthContext] Sending custom password reset email for:', data.email);
      
      // Use our custom email system instead of Supabase's built-in emails
      const useCustomEmails = process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS === 'true';
      
      if (useCustomEmails) {
        // Generate a custom reset token and send via our SMTP service
        try {
          const response = await fetch('/api/auth/send-reset-password-email-smtp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: data.email }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send reset email');
          }

          console.log('[AuthContext] Custom password reset email sent successfully');
          return { error: null };
        } catch (emailError) {
          console.error('[AuthContext] Custom email error:', emailError);
          return { 
            error: { 
              name: 'CustomEmailError', 
              message: emailError instanceof Error ? emailError.message : 'Failed to send reset email' 
            } as SupabaseAuthError 
          };
        }
      } else {
        // Fallback to Supabase's built-in password reset
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
        
        const { error } = await supabase!.auth.resetPasswordForEmail(data.email, {
          redirectTo,
        });
        
        if (error) {
          console.error('[AuthContext] Supabase password reset failed:', error);
          return { error };
        }
        
        console.log('[AuthContext] Supabase password reset email sent successfully');
        return { error: null };
      }
      
    } catch (error) {
      console.error('[AuthContext] Password reset error:', error);
      return { error: { name: 'PasswordResetError', message: 'Failed to process password reset request' } as SupabaseAuthError };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = '/api/auth/google';
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Google sign-in error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Google sign-in failed' 
      };
    }
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
      signInWithGoogle, 
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

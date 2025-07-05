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
  signUpWithGoogle: () => Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
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
        // Don't clean tokens on the reset password page - let the reset component handle them
        if (window.location.pathname === '/reset-password') {
          console.log('[AuthContext] OAuth tokens detected on reset password page - skipping cleanup');
          return;
        }
        
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
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('[AuthContext] Password recovery initiated, maintaining session for reset');
        // During password recovery, we need to maintain the session for the reset process
        // Don't clear user state or trigger sign out
        if (session?.user) {
          setUser(session.user);
        }
        return; // Early return to prevent other handling
      } else if (event === 'SIGNED_IN') {
        // User signed in - clean up OAuth hash if present (but not on reset password page)
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          // Don't interfere with password reset flow
          if (window.location.pathname === '/reset-password') {
            console.log('[AuthContext] Tokens detected on reset password page - skipping OAuth logic');
            if (session?.user) {
              setUser(session.user);
            }
            return; // Early return to prevent OAuth handling
          }
          
          console.log('[AuthContext] User signed in via OAuth, cleaning URL');
          window.history.replaceState({}, document.title, window.location.pathname);
          
          if (session?.user) {
            // Check if this was a legitimate OAuth flow from our app
            const oauthSigninAttempt = sessionStorage.getItem('oauth-signin-attempt');
            const isSignInAttempt = oauthSigninAttempt === 'true';
            const isSignUpAttempt = oauthSigninAttempt === 'false';
            
            // Clean up the flag
            sessionStorage.removeItem('oauth-signin-attempt');
            
            console.log('[AuthContext] OAuth user detected, checking database existence');
            console.log('[AuthContext] OAuth flow type:', { oauthSigninAttempt, isSignInAttempt, isSignUpAttempt });
            
            // Check if user exists in our database (has user_rewards record)
            fetch(`/api/rewards/user/${session.user.id}`)
              .then(response => response.json())
              .then(result => {
                if (!result.success || !result.data) {
                  // User doesn't exist in our database
                  console.log('[AuthContext] User not found in app database');
                  
                  if (isSignInAttempt) {
                    // This was a sign-in attempt but user doesn't exist - redirect to signup
                    console.log('[AuthContext] Sign-in attempt but user not in database, redirecting to signup');
                    
                    // Sign out the user first
                    supabase!.auth.signOut().then(() => {
                      // Show message and redirect to signup
                      alert('Please sign up first before signing in with Google.');
                      window.location.href = '/signup';
                    });
                    return;
                  } else if (isSignUpAttempt) {
                    // This is a legitimate signup flow - continue with setup
                    console.log('[AuthContext] Legitimate OAuth signup flow, setting up user');
                    
                    // Handle referral code and setup
                    const storedReferralCode = sessionStorage.getItem('oauth-referral-code');
                    if (storedReferralCode) {
                      console.log('[AuthContext] Storing referral code in metadata:', storedReferralCode);
                      
                      // Update user metadata with referral code
                      supabase!.auth.updateUser({
                        data: { referral_code: storedReferralCode }
                      }).then(({ error }) => {
                        if (error) {
                          console.error('[AuthContext] Error storing referral code:', error);
                        } else {
                          console.log('[AuthContext] Referral code stored successfully for OAuth user');
                        }
                      });
                    }
                    
                    // Set up OAuth user (create rewards record, etc.)
                    fetch('/api/auth/setup-oauth-user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: session.user.id })
                    }).then(response => response.json())
                      .then(result => {
                        console.log('[AuthContext] OAuth user setup result:', result);
                        // Clean up stored referral code
                        if (storedReferralCode) {
                          sessionStorage.removeItem('oauth-referral-code');
                        }
                        
                        // Redirect to return URL or dashboard
                        const returnUrl = sessionStorage.getItem('oauth-return-url');
                        sessionStorage.removeItem('oauth-return-url');
                        
                        if (returnUrl && returnUrl !== '/signup' && returnUrl !== '/login') {
                          window.location.href = returnUrl;
                        } else {
                          window.location.href = '/dashboard';
                        }
                      })
                      .catch(error => {
                        console.error('[AuthContext] Error setting up OAuth user:', error);
                        // Sign out and redirect to signup on error
                        supabase!.auth.signOut().then(() => {
                          alert('There was an error setting up your account. Please try again.');
                          window.location.href = '/signup';
                        });
                      });
                  } else {
                    // No valid OAuth flow flag - this is suspicious, treat as unauthorized
                    console.log('[AuthContext] No valid OAuth flow flag detected - unauthorized OAuth attempt');
                    
                    // Sign out the user and redirect to signup
                    supabase!.auth.signOut().then(() => {
                      alert('Unauthorized access detected. Please use the signup page to create an account.');
                      window.location.href = '/signup';
                    });
                    return;
                  }
                } else {
                  // User exists in database
                  console.log('[AuthContext] User found in app database');
                  
                  if (isSignInAttempt || !oauthSigninAttempt) {
                    // Allow sign-in for existing users (even if no flag, for backwards compatibility)
                    console.log('[AuthContext] Existing OAuth user signed in successfully');
                    
                    // Redirect to return URL or dashboard
                    const returnUrl = sessionStorage.getItem('oauth-return-url');
                    sessionStorage.removeItem('oauth-return-url');
                    
                    if (returnUrl && returnUrl !== '/signup' && returnUrl !== '/login') {
                      window.location.href = returnUrl;
                    } else {
                      window.location.href = '/dashboard';
                    }
                  } else if (isSignUpAttempt) {
                    // User tried to sign up but already exists - redirect to login
                    console.log('[AuthContext] User tried to sign up but already exists, redirecting to login');
                    
                    supabase!.auth.signOut().then(() => {
                      alert('You already have an account. Please use the login page instead.');
                      window.location.href = '/login';
                    });
                    return;
                  }
                }
              })
              .catch(error => {
                console.error('[AuthContext] Error checking user existence:', error);
                // On error, sign out and redirect to signup
                supabase!.auth.signOut().then(() => {
                  alert('There was an error verifying your account. Please try signing up.');
                  window.location.href = '/signup';
                });
              });
            
            return; // Early return to prevent normal session handling
          }
        }
        
        // Normal sign-in flow (non-OAuth)
        if (session?.user) {
          setUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        // Check if we're on the reset password page to avoid interference
        if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
          console.log('[AuthContext] Ignoring SIGNED_OUT on reset password page');
          return;
        }

        console.log('[AuthContext] User signed out, clearing state');
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
            } catch (cleanupError) {
              console.warn('[AuthContext] Failed to remove localStorage key:', key);
            }
          });
        }
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
        options: {
          data: {
            referralCode: credentials.referralCode || null
          }
        }
      });
      
      // Handle specific Supabase signup errors
      if (error) {
        // Check for various ways Supabase might indicate duplicate email
        if (error.message.includes("User already registered") || 
            error.message.includes("Email address is already registered") ||
            error.message.includes("already been registered") ||
            error.message.includes("Email rate limit exceeded") ||
            (error.status === 422 && error.message.includes("email"))) {
          return { 
            data: null, 
            error: { 
              name: "UserAlreadyExistsError", 
              message: "An account with this email already exists. Please log in instead." 
            } as SupabaseAuthError 
          };
        }
        return { data: null, error };
      }
      
      if (!data.user && !error) return {data: null, error: {name: "SignUpNoUserError", message: "Sign up did not return a user and no error."} as SupabaseAuthError}
      
      // If user signup was successful and referral code was provided, store it for later processing
      if (data.user && credentials.referralCode) {
        try {
          // Store referral code in user metadata for processing after first order
          await supabase!.auth.updateUser({
            data: { 
              pendingReferralCode: credentials.referralCode.toUpperCase() 
            }
          });
        } catch (referralError) {
          console.error('Failed to store referral code:', referralError);
          // Don't fail the signup for this
        }
      }
      
      return { data: { user: data.user, session: data.session }, error: null };
    } catch (e: any) {
      // Handle network or other unexpected errors
      if (e.message && (e.message.includes("already registered") || e.message.includes("already exists"))) {
        return { 
          data: null, 
          error: { 
            name: "UserAlreadyExistsError", 
            message: "An account with this email already exists. Please log in instead." 
          } as SupabaseAuthError 
        };
      }
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
        sessionStorage.setItem('oauth-signin-attempt', 'true'); // Mark this as a sign-in attempt
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
  
  const signUpWithGoogle = async (): Promise<{ data: { user: User | null; session: any } | null; error: SupabaseAuthError | null } | { code: string, message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);

    try {
      // Store current page for return after OAuth
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth-return-url', window.location.pathname);
        sessionStorage.setItem('oauth-signin-attempt', 'false'); // Mark this as a sign-up attempt
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
      return { data: null, error: { name: 'GoogleSignUpError', message: e.message || "An unexpected error occurred during Google sign up." } as SupabaseAuthError };
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
      signUpWithGoogle, 
      logOut, 
      sendPasswordReset, 
      isSupabaseConfigured 
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

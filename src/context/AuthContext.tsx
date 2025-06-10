
"use client";

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import type { User, AuthError as SupabaseAuthError } from '@supabase/supabase-js'; // Import Supabase User and AuthError
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'; // Import Supabase client and its configured status
import type { SignUpFormData, LoginFormData, ForgotPasswordFormData } from '@/lib/types';

// Define a constant for the admin email for easy modification
const ADMIN_EMAIL = 'admin@elixr.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (data: SignUpFormData) => Promise<{ data: { user: User | null } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
  logIn: (data: LoginFormData) => Promise<{ data: { user: User | null } | null; error: SupabaseAuthError | null } | { code: string; message: string }>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<{ error: SupabaseAuthError | null } | { code: string; message: string }>;
  sendMagicLink: (email: string) => Promise<{ error: SupabaseAuthError | null } | { error: { name: string; message: string } }>;
  verifyOtpCode: (email: string, token: string) => Promise<any | { error: { name: string; message: string } }>;
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

  // Use isSupabaseConfigured and check if the supabase client instance is available
  const isActuallyConfiguredAndAuthReady = isSupabaseConfigured && supabase !== null;

  useEffect(() => {
    if (!isActuallyConfiguredAndAuthReady) {
      console.warn("AuthContext: Supabase Auth is not available or not properly configured. Authentication features will be disabled.");
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // supabase is guaranteed to be non-null here if isActuallyConfiguredAndAuthReady is true
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [isActuallyConfiguredAndAuthReady]);

  const signUp = async (data: SignUpFormData): Promise<{ data: { user: User | null } | null; error: SupabaseAuthError | null } | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    
    const { data: result, error } = await supabase!.auth.signUp({
      email: data.email,
      password: data.password,
    });
    return { data: { user: result.user }, error };
  };

  const logIn = async (data: LoginFormData): Promise<{ data: { user: User | null } | null; error: SupabaseAuthError | null } | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);

    const { data: result, error } = await supabase!.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    return { data: { user: result.user }, error };
  };

  const logOut = async (): Promise<void> => {
    if (!isActuallyConfiguredAndAuthReady) {
      setUser(null);
      setIsAdmin(false);
      return Promise.resolve();
    }
    try {
      const { error } = await supabase!.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      if (error) throw error;
    } catch (error) {
      console.error("AuthContext: Error signing out: ", error);
    }
  };

  const sendPasswordReset = async (data: ForgotPasswordFormData): Promise<{ error: SupabaseAuthError | null } | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    
    const { error } = await supabase!.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`, 
    });
    return { error };
  };

  const sendMagicLink = async (email: string) => {
    if (!isActuallyConfiguredAndAuthReady) return { error: { name: "NotConfigured", message: NOT_CONFIGURED_ERROR_PAYLOAD.message } };
    return supabase!.auth.signInWithOtp({ email });
  };

  const verifyOtpCode = async (email: string, token: string) => {
    if (!isActuallyConfiguredAndAuthReady) return { error: { name: "NotConfigured", message: NOT_CONFIGURED_ERROR_PAYLOAD.message } };
    return supabase!.auth.verifyOtp({ email, token, type: 'email' });
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
      sendMagicLink,
      verifyOtpCode,
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

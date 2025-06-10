
"use client";

import type { User, AuthError } from 'firebase/auth';
import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth as firebaseAuthModule } from '@/lib/firebase'; // firebaseAuthModule can be null
import type { SignUpFormData, LoginFormData, ForgotPasswordFormData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<User | AuthError | { code: string; message: string }>;
  logIn: (data: LoginFormData) => Promise<User | AuthError | { code: string; message: string }>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<void | AuthError | { code: string; message: string }>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED_ERROR = { 
  code: 'auth/not-configured', 
  message: 'Firebase is not configured. Authentication features are disabled. Please check server logs and .env file.' 
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isFirebaseConfigured = !!firebaseAuthModule;

  useEffect(() => {
    if (!firebaseAuthModule) {
      console.warn("AuthContext: Firebase Auth module is not available (likely due to missing configuration). Authentication features will be disabled.");
      setUser(null);
      setLoading(false);
      return; // No cleanup function needed as no listener was attached
    }

    // If firebaseAuthModule is available, proceed with setting up the listener
    const unsubscribe = onAuthStateChanged(firebaseAuthModule, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    // Cleanup function for the listener
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  const signUp = async (data: SignUpFormData): Promise<User | AuthError | { code: string; message: string }> => {
    if (!firebaseAuthModule) return Promise.resolve(NOT_CONFIGURED_ERROR);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuthModule, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logIn = async (data: LoginFormData): Promise<User | AuthError | { code: string; message: string }> => {
    if (!firebaseAuthModule) return Promise.resolve(NOT_CONFIGURED_ERROR);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuthModule, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logOut = async (): Promise<void> => {
    if (!firebaseAuthModule) {
      setUser(null); // Still ensure user state is cleared locally
      console.warn("AuthContext: Attempted logout, but Firebase not configured.");
      return Promise.resolve();
    }
    try {
      await signOut(firebaseAuthModule);
      setUser(null); // Explicitly set user to null on successful logout
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const sendPasswordReset = async (data: ForgotPasswordFormData): Promise<void | AuthError | { code: string; message: string }> => {
    if (!firebaseAuthModule) return Promise.resolve(NOT_CONFIGURED_ERROR);
    try {
      await sendPasswordResetEmail(firebaseAuthModule, data.email);
      return Promise.resolve();
    } catch (error) {
      return error as AuthError;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, sendPasswordReset, isFirebaseConfigured }}>
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

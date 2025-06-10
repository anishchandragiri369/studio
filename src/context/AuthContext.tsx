
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
// Import the flag and modules, which can now be null
import { 
  auth as firebaseAuthService, // This will be null if Firebase isn't configured
  isFirebaseEffectivelyConfigured // Use this flag
} from '@/lib/firebase'; 
import type { SignUpFormData, LoginFormData, ForgotPasswordFormData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<User | AuthError | { code: string; message: string }>;
  logIn: (data: LoginFormData) => Promise<User | AuthError | { code: string; message: string }>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<void | AuthError | { code: string; message: string }>;
  isFirebaseConfigured: boolean; // This will be the flag passed down to UI components
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED_ERROR_PAYLOAD = { 
  code: 'auth/not-configured', 
  message: 'Firebase is not configured correctly or failed to initialize. Authentication features are disabled. Please check console logs from "FirebaseInit" for details, verify your .env file, and restart the server.' 
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Use the imported flag directly. Auth operations also need firebaseAuthService to be non-null.
  const isActuallyConfiguredAndAuthReady = isFirebaseEffectivelyConfigured && firebaseAuthService !== null;

  useEffect(() => {
    if (!isActuallyConfiguredAndAuthReady) {
      console.warn("AuthContext: Firebase Auth is not available or not properly configured. Authentication features will be disabled.");
      setUser(null);
      setLoading(false);
      return; // No cleanup function needed as no listener will be attached
    }

    // If firebaseAuthService is available and Firebase is configured, proceed
    // The `!` tells TypeScript that firebaseAuthService is not null here, due to the check above.
    const unsubscribe = onAuthStateChanged(firebaseAuthService!, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isActuallyConfiguredAndAuthReady]); // Depend on the combined flag

  const signUp = async (data: SignUpFormData): Promise<User | AuthError | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady || !firebaseAuthService) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuthService, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logIn = async (data: LoginFormData): Promise<User | AuthError | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady || !firebaseAuthService) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuthService, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logOut = async (): Promise<void> => {
    if (!isActuallyConfiguredAndAuthReady || !firebaseAuthService) {
      setUser(null); // Ensure user state is cleared locally
      console.warn("AuthContext: Attempted logout, but Firebase Auth not configured/ready.");
      return Promise.resolve();
    }
    try {
      await signOut(firebaseAuthService);
      setUser(null); // Explicitly set user to null on successful logout
    } catch (error) {
      console.error("AuthContext: Error signing out: ", error);
    }
  };

  const sendPasswordReset = async (data: ForgotPasswordFormData): Promise<void | AuthError | { code: string; message: string }> => {
    if (!isActuallyConfiguredAndAuthReady || !firebaseAuthService) return Promise.resolve(NOT_CONFIGURED_ERROR_PAYLOAD);
    try {
      await sendPasswordResetEmail(firebaseAuthService, data.email);
      return Promise.resolve();
    } catch (error) {
      return error as AuthError;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      logIn, 
      logOut, 
      sendPasswordReset, 
      isFirebaseConfigured: isActuallyConfiguredAndAuthReady // Pass the combined status
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

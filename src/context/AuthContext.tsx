
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
import { 
  auth as firebaseAuthService, 
  isFirebaseEffectivelyConfigured 
} from '@/lib/firebase'; 
import type { SignUpFormData, LoginFormData, ForgotPasswordFormData } from '@/lib/types';

// Define a constant for the admin email for easy modification
const ADMIN_EMAIL = 'admin@elixr.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean; // New admin flag
  signUp: (data: SignUpFormData) => Promise<User | AuthError | { code: string; message: string }>;
  logIn: (data: LoginFormData) => Promise<User | AuthError | { code: string; message: string }>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<void | AuthError | { code: string; message: string }>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NOT_CONFIGURED_ERROR_PAYLOAD = { 
  code: 'auth/not-configured', 
  message: 'Firebase is not configured correctly or failed to initialize. Authentication features are disabled. Please check console logs from "FirebaseInit" for details, verify your .env file, and restart the server.' 
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // State for admin status

  const isActuallyConfiguredAndAuthReady = isFirebaseEffectivelyConfigured && firebaseAuthService !== null;

  useEffect(() => {
    if (!isActuallyConfiguredAndAuthReady) {
      console.warn("AuthContext: Firebase Auth is not available or not properly configured. Authentication features will be disabled.");
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthService!, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [isActuallyConfiguredAndAuthReady]);

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
      // Check for admin status on login
      if (userCredential.user && userCredential.user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logOut = async (): Promise<void> => {
    if (!isActuallyConfiguredAndAuthReady || !firebaseAuthService) {
      setUser(null);
      setIsAdmin(false); 
      console.warn("AuthContext: Attempted logout, but Firebase Auth not configured/ready.");
      return Promise.resolve();
    }
    try {
      await signOut(firebaseAuthService);
      setUser(null);
      setIsAdmin(false); // Reset admin status on logout
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
      isAdmin, // Provide admin status
      signUp, 
      logIn, 
      logOut, 
      sendPasswordReset, 
      isFirebaseConfigured: isActuallyConfiguredAndAuthReady 
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

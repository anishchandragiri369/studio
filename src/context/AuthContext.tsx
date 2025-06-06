
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
import { auth } from '@/lib/firebase';
import type { SignUpFormData, LoginFormData, ForgotPasswordFormData } from '@/lib/types'; // Assuming types will be defined

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpFormData) => Promise<User | AuthError>;
  logIn: (data: LoginFormData) => Promise<User | AuthError>;
  logOut: () => Promise<void>;
  sendPasswordReset: (data: ForgotPasswordFormData) => Promise<void | AuthError>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: SignUpFormData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logIn = async (data: LoginFormData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      return error as AuthError;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const sendPasswordReset = async (data: ForgotPasswordFormData) => {
    try {
      await sendPasswordResetEmail(auth, data.email);
    } catch (error) {
      return error as AuthError;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, sendPasswordReset }}>
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

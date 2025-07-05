"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js';

interface GoogleSignInButtonProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  referralCode?: string; // Add referral code prop
  isSignUp?: boolean; // Add prop to distinguish between sign-in and sign-up
}

export default function GoogleSignInButton({ onError, disabled, className, referralCode, isSignUp = false }: GoogleSignInButtonProps) {
  const { signInWithGoogle, signUpWithGoogle, isSupabaseConfigured } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      onError?.("Authentication is currently unavailable. Please check application configuration.");
      return;
    }

    setLoading(true);
    
    // Store referral code in sessionStorage before OAuth redirect
    if (referralCode && typeof window !== 'undefined') {
      sessionStorage.setItem('oauth-referral-code', referralCode.trim());
      console.log('Stored referral code for OAuth:', referralCode);
    }
    
    try {
      // Use the appropriate function based on isSignUp
      const result = isSignUp ? await signUpWithGoogle() : await signInWithGoogle();
      
      if (result && 'error' in result && result.error) {
        const supabaseError = result.error as SupabaseAuthError;
        if (supabaseError.code === 'supabase/not-configured') {
          onError?.(supabaseError.message);
        } else {
          onError?.(supabaseError.message || "Failed to sign in with Google. Please try again.");
        }
        setLoading(false);
      } else if (result && 'code' in result && result.code === 'supabase/not-configured') {
        onError?.(result.message);
        setLoading(false);
      }
      // If successful, the user will be redirected to Google OAuth and back,
      // so we don't need to handle success here or set loading to false
    } catch (error: any) {
      onError?.(error.message || "An unexpected error occurred during Google sign in.");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full ${className || ''}`}
      onClick={handleGoogleSignIn}
      disabled={disabled || loading || !isSupabaseConfigured}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
          />
        </svg>
      )}
      {loading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
}

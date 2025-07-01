"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  size?: 'large' | 'medium' | 'small';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  disabled?: boolean;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
}

export default function GoogleSignInButton({
  text = 'signin_with',
  size = 'large',
  theme = 'outline',
  shape = 'rectangular',
  disabled = false,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;

    try {
      setLoading(true);
      
      // Redirect to our Google OAuth endpoint
      window.location.href = '/api/auth/google';
      
    } catch (error) {
      console.error('[GoogleSignInButton] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      suppressHydrationWarning
      className={`
        relative flex items-center justify-center gap-3 px-6 py-3 
        border border-gray-300 rounded-lg font-medium text-gray-700
        hover:bg-gray-50 hover:border-gray-400 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 ease-in-out
        ${size === 'small' ? 'px-4 py-2 text-sm' : ''}
        ${size === 'large' ? 'px-8 py-4 text-lg' : ''}
        ${theme === 'filled_blue' ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : ''}
        ${theme === 'filled_black' ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-900' : ''}
        ${shape === 'pill' ? 'rounded-full' : ''}
        ${shape === 'circle' ? 'rounded-full w-12 h-12 p-0' : ''}
        ${shape === 'square' ? 'rounded-none' : ''}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          
          {shape !== 'circle' && (
            <span>
              {text === 'signin_with' && 'Sign in with Google'}
              {text === 'signup_with' && 'Sign up with Google'}
              {text === 'continue_with' && 'Continue with Google'}
              {text === 'signin' && 'Google'}
            </span>
          )}
        </>
      )}
    </button>
  );
}

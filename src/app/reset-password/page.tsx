"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Support both Supabase tokens and custom tokens
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const recoveryToken = searchParams.get('token');
  const type = searchParams.get('type');
  const email = searchParams.get('email'); // Supabase includes email parameter
  
  // Determine which flow we're using
  // Supabase flow: has access_token, or has token + type=recovery, or has token + email
  const isSupabaseFlow = accessToken || (recoveryToken && type === 'recovery') || (recoveryToken && email);
  // Custom flow: has token but none of the Supabase indicators
  const isCustomFlow = recoveryToken && !isSupabaseFlow;

  console.log('[ResetPassword] Flow detection:', {
    accessToken: !!accessToken,
    refreshToken: !!refreshToken,
    recoveryToken: !!recoveryToken,
    type,
    email: !!email,
    isSupabaseFlow,
    isCustomFlow
  });

  // If recoveryToken and type=recovery, exchange for session
  const [sessionReady, setSessionReady] = useState(!recoveryToken || type !== 'recovery');
  useEffect(() => {
    async function handleRecovery() {
      if (recoveryToken && type === 'recovery') {
        if (!supabase) {
          setError('Supabase client is not initialized.');
          return;
        }
        const { data, error } = await supabase.auth.exchangeCodeForSession(recoveryToken);
        if (error) {
          setError('Invalid or expired recovery link.');
        } else {
          setSessionReady(true);
        }
      }
    }
    handleRecovery();
  }, [recoveryToken, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isCustomFlow) {
        // Handle custom token flow
        console.log('[ResetPassword] Using custom token flow with token:', recoveryToken);
        
        const response = await fetch('/api/auth/reset-password-with-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: recoveryToken,
            newPassword: password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('[ResetPassword] Custom token error:', result);
          setError(result.error || 'Failed to reset password');
          setLoading(false);
          return;
        }

        console.log('[ResetPassword] Custom token success:', result);
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
        
      } else if (isSupabaseFlow) {
        // Handle Supabase flow
        console.log('[ResetPassword] Using Supabase flow');
        
        if (!supabase) {
          setError('Supabase client is not initialized.');
          setLoading(false);
          return;
        }

        // Try different approaches for Supabase tokens
        if (accessToken) {
          // Method 1: Direct session setting with access token
          await supabase.auth.setSession({ 
            access_token: accessToken, 
            refresh_token: refreshToken || '' 
          });
        } else if (recoveryToken && email) {
          // Method 2: For recovery tokens with email, try to sign in and update
          console.log('[ResetPassword] Attempting to handle recovery token with email');
          
          // This is a recovery token format - try to exchange it
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryToken);
            if (exchangeError) {
              console.warn('[ResetPassword] Code exchange failed, trying alternative method:', exchangeError);
              
              // Alternative: Use the admin API to reset password directly
              const response = await fetch('/api/auth/reset-password-admin', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: email,
                  newPassword: password,
                  token: recoveryToken
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reset password via admin API');
              }

              console.log('[ResetPassword] Password reset via admin API successful');
              setSuccess(true);
              setTimeout(() => router.push('/login'), 2000);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('[ResetPassword] Recovery token handling failed:', err);
            setError('This reset link appears to be invalid or expired. Please request a new password reset.');
            setLoading(false);
            return;
          }
        }

        // Try to update password
        const { error } = await supabase.auth.updateUser({ password });
        
        if (error) {
          setError(error.message);
        } else {
          setSuccess(true);
          setTimeout(() => router.push('/login'), 2000);
        }
      } else {
        setError('Invalid reset link. Please request a new password reset.');
      }
    } catch (error) {
      console.error('[ResetPassword] Error:', error);
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h1>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        {success ? (
          <div className="text-green-600 text-center mb-4">Password reset! Redirecting to login...</div>
        ) : (
          <>
            <label className="block mb-2 font-medium">New Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-4"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              suppressHydrationWarning
            />
            <label className="block mb-2 font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-6"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              suppressHydrationWarning
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              suppressHydrationWarning
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
        )}
        {(!accessToken && !refreshToken && !sessionReady) && (
          <div className="mb-4 text-yellow-700 text-xs bg-yellow-100 p-2 rounded">
            {isCustomFlow ? (
              <div>
                <div><strong>Custom Reset Token Detected</strong></div>
                <div>Enter your new password to complete the reset process.</div>
              </div>
            ) : (
              <div>
                <div>Expected access token and refresh token in the URL.</div>
                <div>Please make sure you clicked the correct password reset link from your email.</div>
                <div className="mt-2">
                  <a href="/forgot-password" className="text-blue-600 underline">Request a new password reset link</a>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

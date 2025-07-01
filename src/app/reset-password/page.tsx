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

  // Support both access_token and token (for recovery/magic link)
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const recoveryToken = searchParams.get('token');
  const type = searchParams.get('type');

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
    if (!accessToken && !sessionReady) {
      setError('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      setError('Supabase client is not initialized.');
      return;
    }
    if (accessToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' });
    }
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    }
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
            />
            <label className="block mb-2 font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-6"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
        )}
        {(!accessToken || !refreshToken) && (
          <div className="mb-4 text-yellow-700 text-xs bg-yellow-100 p-2 rounded">
            <div>Expected access token and refresh token in the URL.</div>
            <div>Please make sure you clicked the correct password reset link from your email.</div>
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

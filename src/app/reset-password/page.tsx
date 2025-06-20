"use client";

import { useState, Suspense } from 'react';
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

  // Supabase sends access_token as the query param for password reset
  const accessToken = searchParams.get('access_token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!accessToken) {
      setError('Invalid or missing reset token.');
      return;
    }
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      setError('Supabase client is not initialized.');
      return;
    }
    // Set the access token before updating the password
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: searchParams.get('refresh_token') || '' });
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
              required
            />
            <label className="block mb-2 font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-6"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </>
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

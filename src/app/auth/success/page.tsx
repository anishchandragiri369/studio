"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // First check if user is already authenticated (magic link auto-login)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && session.user && !sessionError) {
          console.log('[Auth Success] User already authenticated via magic link:', session.user.email);
          // User is already logged in, proceed to redirect
          const provider = searchParams.get('provider');
          const isNewUser = searchParams.get('new_user') === 'true';
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, '/auth/success');

          // Show success message briefly then redirect
          setTimeout(() => {
            if (isNewUser) {
              router.push('/');
            } else {
              router.push('/');
            }
          }, 1500);
          
          setLoading(false);
          return;
        }

        // If not authenticated, check for manual token parameters
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('new_user') === 'true';

        if (token) {
          // Handle magic link authentication manually
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash || token,
            type: 'email'
          });

          if (verifyError) {
            console.error('[Auth Success] Magic link verification error:', verifyError);
            setError('Failed to verify authentication token');
            return;
          }

          if (!data.user) {
            setError('Authentication successful but no user data received');
            return;
          }

          console.log('[Auth Success] Magic link authentication successful:', data.user.email);
        } else {
          // Legacy handling for direct access/refresh tokens
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');

          if (!accessToken) {
            setError('No authentication token received');
            return;
          }

          // Set the session in Supabase client
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('[Auth Success] Session error:', sessionError);
            setError('Failed to establish session');
            return;
          }
        }

        // Clear URL parameters
        window.history.replaceState({}, document.title, '/auth/success');

        // Show success message briefly
        setTimeout(() => {
          const isNewUser = searchParams.get('new_user') === 'true';
          if (isNewUser) {
            // Redirect to onboarding or welcome page for new users
            router.push('/');
          } else {
            // Redirect to dashboard or home for returning users
            router.push('/');
          }
        }, 1500);

      } catch (error) {
        console.error('[Auth Success] Error:', error);
        setError('Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Completing sign in...</h2>
          <p className="text-gray-500 mt-2">Please wait while we set up your account</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Authentication Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-700">Welcome to Elixr!</h2>
        <p className="text-gray-500 mt-2">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthSuccessContent />
    </Suspense>
  );
}

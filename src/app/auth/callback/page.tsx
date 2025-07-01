"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          setError('Authentication service not available');
          setLoading(false);
          return;
        }

        // Check for hash-based tokens (implicit flow) first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const expiresIn = hashParams.get('expires_in');
        const tokenType = hashParams.get('token_type');

        // Check for query-based code (authorization code flow)
        const code = searchParams.get('code');
        const error_code = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        if (error_code) {
          setError(error_description || 'Authentication failed');
          setLoading(false);
          return;
        }

        // Handle implicit flow (hash-based tokens)
        if (accessToken && refreshToken) {
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              setError(sessionError.message || 'Failed to complete authentication');
              setLoading(false);
              return;
            }

            if (data.user) {
              setSuccess(true);
              setLoading(false);
              
              // Clear the hash from URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Redirect to home page after a short delay
              setTimeout(() => {
                router.push('/');
              }, 1500);
              return;
            }
          } catch (sessionError: any) {
            console.error('Error handling implicit flow:', sessionError);
            setError(sessionError.message || 'Failed to set authentication session');
            setLoading(false);
            return;
          }
        }

        // Handle authorization code flow
        if (code) {
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError);
              setError(exchangeError.message || 'Failed to complete authentication');
              setLoading(false);
              return;
            }

            if (data.user) {
              setSuccess(true);
              setLoading(false);
              
              // Redirect to home page after a short delay
              setTimeout(() => {
                router.push('/');
              }, 1500);
              return;
            }
          } catch (exchangeError: any) {
            console.error('Error handling authorization code flow:', exchangeError);
            setError(exchangeError.message || 'Failed to exchange code for session');
            setLoading(false);
            return;
          }
        }

        // If we get here, there's no valid auth data
        setError('No valid authentication data received');
        setLoading(false);

      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError(error.message || 'An unexpected error occurred');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Completing Sign In
            </CardTitle>
            <CardDescription>
              Please wait while we complete your authentication...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Sign In Successful!
            </CardTitle>
            <CardDescription>
              You have been successfully signed in. Redirecting you to the home page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Sign In Failed
            </CardTitle>
            <CardDescription className="text-destructive">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login">
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Go to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

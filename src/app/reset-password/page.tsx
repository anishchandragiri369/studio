"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize mount state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get URL parameters from both query params and hash
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);
  const [tokensReady, setTokensReady] = useState(false);
  
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      // Parse hash parameters (Supabase redirects put tokens in hash after /auth/v1/verify)
      const hash = window.location.hash.substring(1);
      if (hash) {
        console.log('Found URL hash:', hash);
        setHashParams(new URLSearchParams(hash));
      } else {
        setHashParams(null);
      }
      setTokensReady(true);
    }
  }, [mounted]);

  // Priority: Check hash first (from Supabase redirect), then query params (direct link)
  const accessToken = tokensReady ? (
    hashParams?.get('access_token') || 
    searchParams.get('access_token')
  ) : null;
  
  const refreshToken = tokensReady ? (
    hashParams?.get('refresh_token') || 
    searchParams.get('refresh_token')
  ) : null;
  
  // For recovery flow: hash will have access_token after Supabase processes the /auth/v1/verify link
  const recoveryToken = tokensReady ? (
    searchParams.get('token') || 
    hashParams?.get('token')
  ) : null;
  
  const type = tokensReady ? (
    searchParams.get('type') || 
    hashParams?.get('type') ||
    // If we have access_token in hash but no type, assume it's from recovery flow
    (hashParams?.get('access_token') ? 'recovery' : null)
  ) : null;

  // Handle recovery token exchange and session establishment
  const [sessionReady, setSessionReady] = useState(false);
  const [tokensProcessed, setTokensProcessed] = useState(false);
  
  useEffect(() => {
    if (!tokensReady || tokensProcessed) return;

    async function handleRecovery() {
      console.log('HandleRecovery started', { 
        recoveryToken, 
        type, 
        accessToken: accessToken ? 'Present' : 'Missing',
        refreshToken: refreshToken ? 'Present' : 'Missing',
        hasHash: !!hashParams?.toString(),
        tokensReady,
        mounted
      });

      if (!supabase) {
        console.error('Supabase client not available');
        setError('Authentication service is not available. Please try again later.');
        setTokensProcessed(true);
        return;
      }

      // Check for Supabase error responses (e.g., expired tokens)
      if (hashParams) {
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');
        
        if (error || errorCode) {
          console.log('Supabase redirect error:', { error, errorCode, errorDescription });
          
          if (errorCode === 'otp_expired' || error === 'access_denied') {
            setError('This password reset link has expired. Please request a new password reset.');
          } else {
            setError(`Reset link error: ${errorDescription || error || 'Unknown error'}`);
          }
          setTokensProcessed(true);
          return;
        }
      }

      // CRITICAL: Establish the recovery session using the tokens from Supabase redirect
      let hasValidResetTokens = false;
      
      try {
        console.log('Checking token conditions:');
        console.log('- accessToken present:', !!accessToken);
        console.log('- refreshToken present:', !!refreshToken);
        console.log('- type === recovery:', type === 'recovery');
        console.log('- recoveryToken present:', !!recoveryToken);
        
        // If we have access_token and refresh_token from hash (Supabase redirect), establish session
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Setting session with tokens from Supabase redirect...');
          console.log('Access token length:', accessToken.length);
          console.log('Refresh token length:', refreshToken.length);
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('Failed to set session:', sessionError);
            setError('Failed to establish recovery session. Please click the reset link again.');
            setTokensProcessed(true);
            return;
          }
          
          console.log('✅ Recovery session established successfully');
          console.log('Session data:', data.session ? 'Present' : 'Missing');
          console.log('User ID:', data.session?.user?.id);
          hasValidResetTokens = true;
        } 
        // If we have recovery token but no session tokens yet, let Supabase handle it
        else if (recoveryToken && type === 'recovery') {
          console.log('Recovery token found - checking existing session...');
          
          // Check if Supabase already established a session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('✅ Existing recovery session found');
            hasValidResetTokens = true;
          } else {
            console.log('No session found with recovery token - user may need to click link again');
            setError('Recovery session not found. Please click the reset link from your email again.');
            setTokensProcessed(true);
            return;
          }
        }
        // Check if there's already an active session (user might have clicked link before)
        else {
          console.log('No valid token combination found');
          console.log('Checking for existing session...');
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('✅ Found existing session');
            hasValidResetTokens = true;
          } else {
            console.log('No session found - invalid reset state');
            setError('No valid recovery session found. Please click the reset link from your email.');
            setTokensProcessed(true);
            return;
          }
        }

        if (hasValidResetTokens) {
          console.log('✅ Recovery session ready for password reset');
          setSessionReady(true);
          
          // Clean the URL hash after we've processed the tokens
          if (typeof window !== 'undefined' && window.location.hash) {
            console.log('Cleaning URL hash after processing tokens');
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error handling recovery session:', error);
        setError('Failed to process recovery tokens. Please try clicking the reset link again.');
      }

      setTokensProcessed(true);
      console.log('HandleRecovery completed - tokens processed:', true, 'session ready:', hasValidResetTokens);
    }

    console.log('Starting handleRecovery...');
    handleRecovery().catch((error) => {
      console.error('HandleRecovery failed:', error);
      setError('An error occurred while processing the reset link. Please try again.');
      setTokensProcessed(true);
    });
  }, [tokensReady, tokensProcessed, recoveryToken, type, accessToken, refreshToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log('Reset password attempt started');
    
    // Basic validation
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }
      
      // Check session status before attempting password update
      console.log('Checking session before password update...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session check error:', sessionError);
        setError('Session error. Please click the reset link from your email again.');
        return;
      }
      
      if (!sessionData.session) {
        console.error('No active session found');
        setError('No active recovery session. Please click the reset link from your email again.');
        return;
      }
      
      console.log('✅ Active session found:', {
        userId: sessionData.session.user?.id,
        email: sessionData.session.user?.email,
        sessionExpiry: sessionData.session.expires_at
      });
      
      console.log('Attempting password update...');
      
      // Use the session to update the password
      const { data, error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error('Password update error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('New password should be different')) {
          setError('New password must be different from your current password.');
        } else if (error.message?.includes('session_not_found') || error.message?.includes('Invalid session')) {
          setError('Session expired. Please click the reset link from your email again.');
        } else if (error.message?.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.');
        } else {
          setError(error.message || 'Failed to update password. Please try again.');
        }
        return;
      }
      
      console.log('✅ Password updated successfully');
      setSuccess(true);
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/login?message=password-reset-success');
      }, 2000);
      
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until component is mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {process.env.NODE_ENV === 'development' && (
            <Alert>
              <AlertTitle>Debug Info (Development Only)</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <div>Access Token: {accessToken ? 'Present' : 'Missing'}</div>
                <div>Refresh Token: {refreshToken ? 'Present' : 'Missing'}</div>
                <div>Recovery Token: {recoveryToken ? 'Present' : 'Missing'}</div>
                <div>Type: {type || 'Not specified'}</div>
                <div>Session Ready: {sessionReady ? 'Yes' : 'No'}</div>
                <div>Tokens Processed: {tokensProcessed ? 'Yes' : 'No'}</div>
                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                <div>Success: {success ? 'Yes' : 'No'}</div>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                <div className="mb-3">{error}</div>
                <div className="text-sm">
                  <a 
                    href="/forgot-password" 
                    className="underline hover:no-underline font-medium"
                  >
                    Request a new password reset link
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {success ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Password Reset Successfully!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your password has been updated. You will be redirected to the login page shortly.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
              
              {!sessionReady && !error && (
                <p className="text-sm text-muted-foreground text-center">
                  Please wait while we verify your reset link...
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline text-primary">Reset Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

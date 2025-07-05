"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth(); // Get user from AuthContext
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
  const [storedTokens, setStoredTokens] = useState<{access_token?: string, refresh_token?: string} | null>(null);
  
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      // Parse hash parameters (Supabase redirects put tokens in hash after /auth/v1/verify)
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        setHashParams(params);
        
        // Store tokens before they get cleared from the URL
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          setStoredTokens({ access_token: accessToken, refresh_token: refreshToken });
        }
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
  
  // Watch for AuthContext user and set sessionReady when user is available
  useEffect(() => {
    if (user && tokensProcessed) {
      setSessionReady(true);
    }
  }, [user, tokensProcessed]);
  
  useEffect(() => {
    if (!tokensReady || tokensProcessed) return;

    async function handleRecovery() {
      if (!supabase) {
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
        // If we have access_token and refresh_token from hash (Supabase redirect), establish session
        if (accessToken && refreshToken && type === 'recovery') {
          // Try to set session but don't hang if it fails
          try {
            const sessionPromise = supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            // Wait max 5 seconds for setSession
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('setSession timeout')), 5000)
            );
            
            const result = await Promise.race([sessionPromise, timeoutPromise]);
            const { data, error: sessionError } = result as any;
            
            if (sessionError) {
              // Session error, but continue checking
            } else {
              // Recovery session established successfully
            }
          } catch (setSessionError) {
            // setSession timed out or failed, continue checking
          }
          
          // Whether setSession worked or not, check if we now have a session
          // The sessionReady flag will be set by a separate useEffect watching the user
          hasValidResetTokens = true; // Allow the process to continue
        } 
        // If we have recovery token but no session tokens yet, let Supabase handle it
        else if (recoveryToken && type === 'recovery') {
          // Check if Supabase already established a session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            hasValidResetTokens = true;
          } else {
            setError('Recovery session not found. Please click the reset link from your email again.');
            setTokensProcessed(true);
            return;
          }
        }
        // Check if there's already an active session (user might have clicked link before)
        else {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            hasValidResetTokens = true;
          } else {
            setError('No valid recovery session found. Please click the reset link from your email.');
            setTokensProcessed(true);
            return;
          }
        }

        if (hasValidResetTokens) {
          setSessionReady(true);
          
          // Clean the URL hash after we've processed the tokens
          if (typeof window !== 'undefined' && window.location.hash) {
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 100);
          }
        }
      } catch (error) {
        setError('Failed to process recovery tokens. Please try clicking the reset link again.');
      }

      setTokensProcessed(true);
    }
    
    handleRecovery().catch((error) => {
      setError('An error occurred while processing the reset link. Please try again.');
      setTokensProcessed(true);
    });
  }, [tokensReady, tokensProcessed, recoveryToken, type, accessToken, refreshToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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
      
      // Wait for session to be established (sessionReady flag)
      if (!sessionReady) {
        setError('Recovery session not ready. Please wait a moment and try again.');
        return;
      }
      
      // Use AuthContext user instead of getSession to avoid hanging
      if (!user) {
        setError('No authenticated user. Please click the reset link from your email again.');
        return;
      }
      
      // Use the session to update the password with timeout
      try {
        // Check if we still have valid tokens stored
        if (!storedTokens?.access_token || !storedTokens?.refresh_token) {
          setError('Session expired. Please click the reset link from your email again.');
          return;
        }
        
        // Use direct fetch to Supabase auth API
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const authUrl = `${supabaseUrl}/auth/v1/user`;
        
        // Add 10 second timeout to prevent hanging  
        const updatePromise = fetch(authUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedTokens.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          },
          body: JSON.stringify({
            password: password
          })
        });
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Password update timeout after 10 seconds')), 10000)
        );
        
        const result = await Promise.race([updatePromise, timeoutPromise]);
        const response = result as Response;
        
        if (!response.ok) {
          const errorText = await response.text();
          
          let errorMessage = 'Failed to update password. Please try again.';
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.msg || errorData.message) {
              const msg = errorData.msg || errorData.message;
              if (msg.includes('New password should be different')) {
                errorMessage = 'New password must be different from your current password.';
              } else if (msg.includes('session_not_found') || msg.includes('Invalid session')) {
                errorMessage = 'Session expired. Please click the reset link from your email again.';
              } else if (msg.includes('Password should be at least')) {
                errorMessage = 'Password must be at least 6 characters long.';
              } else if (msg.includes('weak_password')) {
                errorMessage = 'Password is too weak. Please use a stronger password.';
              } else {
                errorMessage = msg;
              }
            }
          } catch (parseError) {
            // Error parsing response, use default message
          }
          
          setError(errorMessage);
          return;
        }
        
        const responseData = await response.json();
        setSuccess(true);
        
        // Sign out and redirect to login
        try {
          // Add timeout to signOut to prevent hanging
          const signOutPromise = supabase.auth.signOut();
          const signOutTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignOut timeout after 3 seconds')), 3000)
          );
          
          await Promise.race([signOutPromise, signOutTimeoutPromise]);
        } catch (signOutError) {
          // Continue with redirect even if signOut fails
        }
        
        setTimeout(() => {
          router.push('/login?message=password-reset-success');
        }, 2000);
        
      } catch (updateError: any) {
        if (updateError.message?.includes('timeout')) {
          setError('Password update is taking too long. Please try again or click the reset link from your email again.');
        } else if (updateError.message?.includes('NetworkError') || updateError.message?.includes('fetch')) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(updateError.message || 'Failed to update password. Please try again.');
        }
        return;
      }
      
    } catch (err: any) {
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
          {/* Show loading while establishing session */}
          {!sessionReady && !error && !success && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Establishing Recovery Session</AlertTitle>
              <AlertDescription>
                Setting up your password reset session. Please wait...
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
          ) : sessionReady ? (
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
          ) : null}
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

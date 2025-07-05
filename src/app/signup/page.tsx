"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { signUpSchema } from '@/lib/zod-schemas';
import type { SignUpFormData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, MailCheck, Gift, CheckCircle } from 'lucide-react';
import type { AuthError as SupabaseAuthError, User } from '@supabase/supabase-js';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [referralCodeValidation, setReferralCodeValidation] = useState<{
    isValid: boolean;
    message: string;
    checking: boolean;
  }>({ isValid: false, message: '', checking: false });
  
  // Check if this is an OAuth flow
  const isOAuthFlow = searchParams.get('oauth') === 'true';
  const isExistingOAuthUser = searchParams.get('existing') === 'true';

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const referralCode = watch('referralCode');

  // Auto-fill referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('referralCode', refCode);
    }
  }, [searchParams, setValue]);

  // Validate referral code when it changes
  useEffect(() => {
    if (referralCode && referralCode.length >= 6) {
      validateReferralCode(referralCode);
    } else if (referralCode && referralCode.length < 6) {
      setReferralCodeValidation({
        isValid: false,
        message: 'Referral code should be at least 6 characters',
        checking: false
      });
    } else {
      setReferralCodeValidation({ isValid: false, message: '', checking: false });
    }
  }, [referralCode]);

  const validateReferralCode = async (code: string) => {
    setReferralCodeValidation({ isValid: false, message: '', checking: true });
    
    try {
      const response = await fetch('/api/referrals/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: code })
      });

      const result = await response.json();
      
      if (result.success) {
        setReferralCodeValidation({
          isValid: true,
          message: 'Valid referral code! You\'ll earn bonus rewards.',
          checking: false
        });
      } else {
        setReferralCodeValidation({
          isValid: false,
          message: result.message || 'Invalid referral code',
          checking: false
        });
      }
    } catch (error) {
      setReferralCodeValidation({
        isValid: false,
        message: 'Unable to validate referral code',
        checking: false
      });
    }
  };

  useEffect(() => {
    if (!authLoading && user && isSupabaseConfigured) {
      router.push('/'); 
    }
  }, [user, authLoading, router, isSupabaseConfigured]);

  if (typeof window !== 'undefined') {
    document.title = 'Sign Up - Elixr';
  }

  const onSubmit = async (data: SignUpFormData) => {
    if (!isSupabaseConfigured) {
      setError("Account creation is currently unavailable. Please check application configuration.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setSubmitLoading(true);

    // Call the signUp function from AuthContext
    const result = await signUp(data);

    if ('error' in result && result.error) {
      const supabaseError = result.error as SupabaseAuthError;
      if (supabaseError.name === "UserAlreadyExistsError" || 
          supabaseError.message.includes("already exists") ||
          supabaseError.message.includes("User already registered")) {
        setError("This email is already registered. Please log in instead or use a different email address.");
      } else if (result.error.code === 'supabase/not-configured') {
        setError(result.error.message);
      } else {
        setError(supabaseError.message || "An unexpected error occurred during sign up. Please try again.");
      }
    } else if ('code' in result && 'message' in result) {
      setError(result.message);
    } else if (result.data?.user) {
      setSuccessMessage("Sign up successful! Please check your email to confirm your account. You will be able to log in after confirming.");
    } else {
      setError("An unexpected issue occurred. User data not received. Please try again.");
    }
    setSubmitLoading(false);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 mobile-container">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  if (user && isSupabaseConfigured) return null;

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 mobile-container">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">
            {isOAuthFlow ? (isExistingOAuthUser ? 'Complete Your Account Setup' : 'Welcome to Elixr!') : 'Create an Account'}
          </CardTitle>
          <CardDescription>
            {isOAuthFlow 
              ? (isExistingOAuthUser 
                  ? 'Complete your account setup to access all features'
                  : 'Complete your Google signup to start your fresh juice journey!'
                )
              : 'Join Elixr and start your fresh juice journey!'
            }
          </CardDescription>
          {isOAuthFlow && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                {isExistingOAuthUser 
                  ? 'Google authentication completed. Please finish your account setup below.'
                  : 'Google authentication successful! Please complete your profile below.'
                }
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isSupabaseConfigured && !successMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sign Up Unavailable</AlertTitle>
              <AlertDescription>
                Account creation features are currently disabled due to a configuration issue. The site administrator has been notified. Please try again later or continue browsing other parts of the site.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Sign Up Failed</AlertTitle>
              <AlertDescription>
                {error}
                {error.includes("already registered") && (
                  <div className="mt-2">
                    <Link href="/login" className="font-semibold underline hover:no-underline">
                      Go to Login Page
                    </Link>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="default" className="mb-6 bg-green-50 border-green-300">
              <MailCheck className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-700">Check Your Email!</AlertTitle>
              <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
            </Alert>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} disabled={!isSupabaseConfigured || submitLoading} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="•••••••• (min. 6 characters)" autoComplete="new-password" {...register("password")} disabled={!isSupabaseConfigured || submitLoading}/>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" {...register("confirmPassword")} disabled={!isSupabaseConfigured || submitLoading}/>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referralCode" className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  Referral Code (Optional)
                </Label>
                <Input 
                  id="referralCode" 
                  type="text" 
                  placeholder="Enter referral code to earn bonus rewards" 
                  {...register("referralCode")} 
                  disabled={!isSupabaseConfigured || submitLoading}
                  className={referralCodeValidation.isValid ? 'border-green-500 focus:ring-green-500' : ''}
                />
                {referralCodeValidation.checking && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Validating referral code...
                  </p>
                )}
                {referralCodeValidation.message && !referralCodeValidation.checking && (
                  <p className={`text-sm flex items-center gap-2 ${
                    referralCodeValidation.isValid ? 'text-green-600' : 'text-destructive'
                  }`}>
                    {referralCodeValidation.isValid ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {referralCodeValidation.message}
                  </p>
                )}
                {errors.referralCode && <p className="text-sm text-destructive">{errors.referralCode.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isSupabaseConfigured || submitLoading}>
                {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <GoogleSignInButton 
                onError={setError}
                disabled={submitLoading}
                referralCode={referralCode}
                isSignUp={true}
              />
            </form>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Already have an account?{' '}
            <Link href="/login" className={`font-semibold text-primary hover:underline ${!isSupabaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>
               Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

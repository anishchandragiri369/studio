"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Loader2, AlertTriangle, MailCheck } from 'lucide-react';
import type { AuthError as SupabaseAuthError, User } from '@supabase/supabase-js';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

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
      if (supabaseError.message.includes("User already registered")) {
        setError("This email is already registered. Try logging in.");
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
          <CardTitle className="text-3xl font-headline text-primary">Create an Account</CardTitle>
          <CardDescription>Join Elixr and start your fresh juice journey!</CardDescription>
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
              <AlertDescription>{error}</AlertDescription>
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
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isSupabaseConfigured || submitLoading}>
                {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
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

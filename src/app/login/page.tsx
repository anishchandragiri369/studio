"use client";

import { useState, useEffect, Suspense } from 'react';
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
import { loginSchema } from '@/lib/zod-schemas';
import type { LoginFormData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { AuthError as SupabaseAuthError } from '@supabase/supabase-js'; // Corrected import
import AuthPageCacheBuster from '@/components/auth/AuthPageCacheBuster';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logIn, user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user && isSupabaseConfigured) {
      router.push('/'); 
    }
  }, [user, authLoading, router, isSupabaseConfigured]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Login - Elixr';
    }
  }, []);

  useEffect(() => {
    // Check for password reset success message
    const message = searchParams.get('message');
    if (message === 'password-reset-success') {
      setSuccessMessage('Password reset successfully! You can now log in with your new password.');
      // Clean up the URL
      router.replace('/login', undefined);
    }
  }, [searchParams, router]);

  const onSubmit = async (data: LoginFormData) => {
    if (!isSupabaseConfigured) {
      setError("Authentication is currently unavailable. Please check application configuration.");
      return;
    }
    setError(null);
    setSubmitLoading(true);
    const result = await logIn(data);
    
    if (result && 'data' in result && result.data?.user) { 
      router.push('/');
    } else if (result && 'error' in result && result.error) {
      const supabaseError = result.error as SupabaseAuthError;
      if (supabaseError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (supabaseError.code === 'supabase/not-configured') {
        setError(supabaseError.message); 
      } else {
        setError(supabaseError.message || "An unexpected error occurred. Please try again.");
      }
    } else if (result && 'code' in result && result.code === 'supabase/not-configured') { 
        setError(result.message);
    }
    else {
        setError("An unexpected error occurred during login. Please try again.");
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
      <AuthPageCacheBuster />
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Elixr account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isSupabaseConfigured && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Unavailable</AlertTitle>
              <AlertDescription>
                Login features are currently disabled due to a configuration issue. Please try again later or continue browsing other parts of the site.
              </AlertDescription>
            </Alert>
          )}
          
          <GoogleSignInButton disabled={!isSupabaseConfigured} isSignUp={false} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMessage && (
              <Alert className="border-green-200 bg-green-50">
                <AlertTitle className="text-green-800">Success!</AlertTitle>
                <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} disabled={!isSupabaseConfigured || submitLoading} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} disabled={!isSupabaseConfigured || submitLoading} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isSupabaseConfigured || submitLoading}>
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/forgot-password" className={`text-sm text-primary hover:underline text-center ${!isSupabaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>
            Forgot your password?
          </Link>
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={`font-semibold text-primary hover:underline ${!isSupabaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 mobile-container">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

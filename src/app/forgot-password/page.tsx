
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
import { forgotPasswordSchema } from '@/lib/zod-schemas';
import type { ForgotPasswordFormData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { AuthError } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendPasswordReset, user, loading: authLoading, isFirebaseConfigured } = useAuth(); // Use isFirebaseConfigured
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  
 useEffect(() => {
    if (!authLoading && user && isFirebaseConfigured) { // Only redirect if configured and user exists
      router.push('/'); 
    }
  }, [user, authLoading, router, isFirebaseConfigured]);

  if (typeof window !== 'undefined') {
    document.title = 'Forgot Password - Elixr';
  }

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (!isFirebaseConfigured) {
      setError("Password reset is currently unavailable. Please check application configuration.");
      return;
    }
    setError(null);
    setMessage(null);
    setSubmitLoading(true);
    const result = await sendPasswordReset(data);
    if (result && 'code' in result) { 
      const errorResult = result as AuthError | { code: string; message: string };
      if (errorResult.code === 'auth/not-configured') {
         setError(errorResult.message); // Show specific "not configured" message
      } else {
        setError(errorResult.message || "Failed to send password reset email. Please try again.");
      }
    } else { 
      setMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
    }
    setSubmitLoading(false);
  };
  
  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  if (user && isFirebaseConfigured) return null;


  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Forgot Your Password?</CardTitle>
          <CardDescription>Enter your email address and we&apos;ll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured && !message &&( 
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Password Reset Unavailable</AlertTitle>
              <AlertDescription>
                This feature is currently disabled due to a configuration issue. The site administrator has been notified. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert>
                <AlertTitle>Email Sent</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {!message && ( 
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} disabled={!isFirebaseConfigured || submitLoading} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            )}
             {!message && (
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isFirebaseConfigured || submitLoading}>
                  {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
             )}
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Remembered your password?{' '}
            <Link href="/login" passHref legacyBehavior>
              <a className={`font-semibold text-primary hover:underline ${!isFirebaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>Log in</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

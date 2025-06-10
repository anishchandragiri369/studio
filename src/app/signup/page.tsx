
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
import { Loader2, AlertTriangle } from 'lucide-react';
import type { AuthError } from 'firebase/auth';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, user, loading: authLoading, isFirebaseConfigured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

 useEffect(() => {
    if (!authLoading && user) {
      router.push('/'); // Redirect if already logged in
    }
  }, [user, authLoading, router]);

  if (typeof window !== 'undefined') {
    document.title = 'Sign Up - Elixr';
  }

  const onSubmit = async (data: SignUpFormData) => {
     if (!isFirebaseConfigured) {
      setError("Sign up is currently unavailable. Please try again later.");
      return;
    }
    setError(null);
    setSubmitLoading(true);
    const result = await signUp(data);
    if (result && 'uid' in result && typeof result.uid === 'string') { // User
      router.push('/'); 
    } else { // AuthError or custom error
      const errorResult = result as AuthError | { code: string; message: string };
      if (errorResult.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try logging in.");
      } else if (errorResult.code === 'auth/not-configured') {
        setError(errorResult.message);
      }
      else {
        setError(errorResult.message || "An unexpected error occurred. Please try again.");
      }
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
  if (user) return null;


  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Create an Account</CardTitle>
          <CardDescription>Join Elixr and start your fresh juice journey!</CardDescription>
        </CardHeader>
        <CardContent>
           {!isFirebaseConfigured && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sign Up Unavailable</AlertTitle>
              <AlertDescription>
                Account creation is currently disabled due to a configuration issue. Please try again later.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Sign Up Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} disabled={!isFirebaseConfigured || submitLoading} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="•••••••• (min. 6 characters)" {...register("password")} disabled={!isFirebaseConfigured || submitLoading}/>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} disabled={!isFirebaseConfigured || submitLoading}/>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isFirebaseConfigured || submitLoading}>
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Already have an account?{' '}
            <Link href="/login" passHref legacyBehavior>
               <a className={`font-semibold text-primary hover:underline ${!isFirebaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>Log in</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

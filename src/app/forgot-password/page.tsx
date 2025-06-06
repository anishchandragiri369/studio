
"use client";

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import type { AuthError } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendPasswordReset, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  
  if (user) {
    router.push('/'); // Redirect if already logged in
    return null;
  }

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setMessage(null);
    setLoading(true);
    const result = await sendPasswordReset(data);
    if (result && 'code' in result) { // It's an AuthError
      const authError = result as AuthError;
      setError(authError.message || "Failed to send password reset email. Please try again.");
    } else {
      setMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
    }
    setLoading(false);
  };
  
  if (typeof window !== 'undefined') {
    document.title = 'Forgot Password - Elixr';
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Forgot Your Password?</CardTitle>
          <CardDescription>Enter your email address and we&apos;ll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
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
            {!message && ( // Only show form if no success message
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            )}
             {!message && (
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
             )}
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Remembered your password?{' '}
            <Link href="/login" passHref legacyBehavior>
              <a className="font-semibold text-primary hover:underline">Log in</a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

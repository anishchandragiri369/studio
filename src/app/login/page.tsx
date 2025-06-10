
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
import { loginSchema } from '@/lib/zod-schemas';
import type { LoginFormData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { AuthError } from 'firebase/auth';
export default function LoginPage() {
  const [step, setStep] = useState<'input' | 'otp'>('input'); // 'input' for email/phone, 'otp' for verification
  const [identifier, setIdentifier] = useState(''); // To store email or phone number
  const [otp, setOtp] = useState(''); // To store the OTP
  const [confirmationResult, setConfirmationResult] = useState<any>(null); // To store the confirmation result for phone auth

  const router = useRouter();
  const { logIn, user, loading: authLoading, isFirebaseConfigured, sendMagicLink, verifyOtpCode } = useAuth(); // Use isFirebaseConfigured and Supabase methods
  const [error, setError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Adjust form schema to be optional for password when using OTP
  const formSchema = loginSchema.partial();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user && isFirebaseConfigured) { // Only redirect if configured and user exists
      router.push('/'); 
    }
  }, [user, authLoading, router, isFirebaseConfigured]);
  
  if (typeof window !== 'undefined') {
    document.title = 'Login - Elixr';
  }

  const handleEmailPasswordLogin = async (data: z.infer<typeof formSchema>) => {
    if (!isFirebaseConfigured) {
      setError("Authentication is currently unavailable. Please check application configuration.");
      return;
    }
    setError(null);
    setSubmitLoading(true);
    const result = await logIn(data);
    
    if (result && 'uid' in result && typeof result.uid === 'string') { 
      router.push('/');
    } else { 
      const errorResult = result as AuthError | { code: string; message: string };
      if (errorResult.code === 'auth/invalid-credential' || errorResult.code === 'auth/user-not-found' || errorResult.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (errorResult.code === 'auth/not-configured') {
        setError(errorResult.message); // Show specific "not configured" message from AuthContext
      }
      else {
        setError(errorResult.message || "An unexpected error occurred. Please try again.");
      }
    }
    setSubmitLoading(false);
  };

  const handleSendOtp = async (type: 'email' | 'phone') => {
    if (!isFirebaseConfigured) {
      setError("Authentication is currently unavailable. Please check application configuration.");
      return;
    }
    if (!identifier) {
      setError(`Please enter your ${type === 'email' ? 'email' : 'phone number'}.`);
      return;
    }
    setError(null);
    setSubmitLoading(true);
    try {
      if (type === 'email') {
        // Supabase email OTP/magic link
        const { error } = await sendMagicLink(identifier);
        if (error) throw error;
      } else {
        // Supabase phone OTP (requires Twilio or similar setup in Supabase)
        // You might need a recaptcha verifier for phone sign-in
        // const { data, error } = await supabase.auth.signInWithOtp({ phone: identifier });
      }
      setStep('otp');
      setSubmitLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
      setSubmitLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!identifier || !otp) {
      setError("Please enter both the identifier and the OTP.");
      return;
    }
    setSubmitLoading(true);
    try {
      const { data, error: verifyError } = await verifyOtpCode(identifier, otp);
      if (verifyError) throw verifyError;
      router.push('/'); // Redirect on successful verification
    } catch (err: any) {
       // Supabase verification errors have specific codes or messages
      setError(err.message || "Failed to verify OTP. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user && isFirebaseConfigured) return null; 

  // Determine if authentication is available based on Supabase config
  // Assuming isFirebaseConfigured now checks for Supabase configuration
  const isAuthenticationAvailable = isFirebaseConfigured; 

  const onSubmit = handleSubmit(handleEmailPasswordLogin);


  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline text-primary">Welcome Back!</CardTitle>
          <CardDescription>Log in to your Elixr account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isFirebaseConfigured && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Unavailable</AlertTitle>
              <AlertDescription>
                Login features are currently disabled due to a configuration issue. The site administrator has been notified. Please try again later or continue browsing other parts of the site.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Login Failed</AlertTitle>
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
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} disabled={!isFirebaseConfigured || submitLoading} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!isFirebaseConfigured || submitLoading}>
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/forgot-password" className={`text-sm text-primary hover:underline text-center ${!isFirebaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>
            Forgot your password?
          </Link>
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={`font-semibold text-primary hover:underline ${!isFirebaseConfigured ? 'pointer-events-none opacity-50' : ''}`}>
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

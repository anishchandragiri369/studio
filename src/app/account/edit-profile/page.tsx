
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, User, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { editProfileSchema } from '@/lib/zod-schemas';
import type { EditProfileFormData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function EditProfilePage() {
  const { user, logOut, loading: authLoading, isSupabaseConfigured, isAdmin } = useAuth(); // Assuming updateUserMetadata might be added to useAuth later
  const router = useRouter();
  const { toast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
  });

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/account/edit-profile');
    }
    if (user) {
      // Pre-fill form with existing data if available
      setValue('fullName', user.user_metadata?.full_name || '');
      // setValue('avatarUrl', user.user_metadata?.avatar_url || '');
    }
  }, [user, authLoading, router, isSupabaseConfigured, setValue]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Edit Profile - Elixr';
    }
  }, []);

  const onSubmit: SubmitHandler<EditProfileFormData> = async (data) => {
    if (!user) return;
    setSubmitLoading(true);

    // Conceptual: In a real app, call a function from useAuth to update user metadata
    // e.g., const { error } = await updateUserMetadata({ data: { full_name: data.fullName, avatar_url: data.avatarUrl } });
    console.log("Conceptual: Updating user profile with data:", data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Profile Updated (Conceptual)",
      description: "Your profile details have been conceptually updated.",
    });
    // Potentially refresh user data or redirect
    // For now, just log and show toast
    
    setSubmitLoading(false);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSupabaseConfigured && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feature Unavailable</AlertTitle>
          <AlertDescription>
            Profile editing is currently disabled due to a configuration issue.
          </AlertDescription>
        </Alert>
         <div className="mt-6 text-center">
            <Button variant="outline" asChild>
                <Link href="/account"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Account</Link>
            </Button>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12 text-center">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please log in to edit your profile.</p>
        <Button asChild>
          <Link href="/login?redirect=/account/edit-profile">Log In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/account">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Account
        </Link>
      </Button>
      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
          Edit Profile
        </h1>
        <p className="text-lg text-muted-foreground">Update your account information.</p>
      </section>

      <Card className="max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Your Details</CardTitle>
          <CardDescription>Keep your profile information up to date.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email || ''} disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                placeholder="Enter your full name" 
                {...register("fullName")}
                disabled={submitLoading}
              />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Avatar URL input - conceptual for now 
            <div className="space-y-1">
              <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
              <Input 
                id="avatarUrl" 
                type="url" 
                placeholder="https://example.com/avatar.png" 
                {...register("avatarUrl")}
                disabled={submitLoading}
              />
              {errors.avatarUrl && <p className="text-sm text-destructive mt-1">{errors.avatarUrl.message}</p>}
              <p className="text-xs text-muted-foreground">Link to your profile picture.</p>
            </div>
            */}

            <Alert variant="default" className="mt-4 p-3 text-xs bg-muted/30 border-primary/30">
                <AlertTriangle className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
                <AlertDescription>
                 This is a conceptual profile editor. Changes are logged to the console and not persisted to Supabase yet.
                 Password change functionality would typically be separate or require current password verification.
                </AlertDescription>
            </Alert>

          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitLoading || !isSupabaseConfigured}>
              {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes (Conceptual)
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

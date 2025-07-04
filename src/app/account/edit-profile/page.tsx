
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, User, Save, ArrowLeft, Info, KeyRound, Camera, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { editProfileSchema } from '@/lib/zod-schemas';
import type { EditProfileFormData } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client for direct auth method
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';


export default function EditProfilePage() {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: '',
      newPassword: '',
      confirmNewPassword: '',
    }
  });

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/account/edit-profile');
    }
    if (user) {
      setValue('fullName', user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      // Load existing profile photo URL
      setProfilePhotoUrl(user.user_metadata?.profile_photo_url || null);
    }
  }, [user, authLoading, router, isSupabaseConfigured, setValue]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Edit Profile - Elixr';
    }
  }, []);

  const uploadProfilePhoto = async (file: File): Promise<string | null> => {
    if (!user || !supabase) return null;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const photoUrl = await uploadProfilePhoto(file);
    if (photoUrl) {
      setProfilePhotoUrl(photoUrl);
      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been uploaded successfully.",
      });
    } else {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeProfilePhoto = () => {
    setProfilePhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit: SubmitHandler<EditProfileFormData> = async (data) => {
    if (!user || !isSupabaseConfigured || !supabase) { // also check for supabase client instance
        toast({
            title: "Update Failed",
            description: "Profile update is currently unavailable or you are not logged in.",
            variant: "destructive",
        });
        return;
    }
    setSubmitLoading(true);

    let profileUpdated = false;
    let passwordChanged = false;

    try {
      // Update full name if it has changed
      if (data.fullName && data.fullName !== (user.user_metadata?.full_name || user.email?.split('@')[0])) {
        const { error: nameError } = await supabase.auth.updateUser({
            data: { full_name: data.fullName } 
        });
        if (nameError) throw nameError;
        profileUpdated = true;
        // Update user context (optional, as onAuthStateChange should eventually catch it)
        if (user && user.user_metadata) user.user_metadata.full_name = data.fullName;
      }

      // Update profile photo if it has changed
      if (profilePhotoUrl !== (user.user_metadata?.profile_photo_url || null)) {
        const { error: photoError } = await supabase.auth.updateUser({
            data: { profile_photo_url: profilePhotoUrl } 
        });
        if (photoError) throw photoError;
        profileUpdated = true;
        // Update user context
        if (user && user.user_metadata) user.user_metadata.profile_photo_url = profilePhotoUrl;
      }

      // Update password if new password is provided and valid
      if (data.newPassword && data.newPassword.length >= 6 && data.newPassword === data.confirmNewPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ 
          password: data.newPassword 
        });
        if (passwordError) throw passwordError;
        passwordChanged = true;
      }
      
      if (profileUpdated && passwordChanged) {
        toast({
            title: "Profile & Password Updated",
            description: "Your details and password have been successfully updated.",
        });
      } else if (profileUpdated) {
        toast({
            title: "Profile Updated",
            description: "Your profile details have been updated.",
        });
      } else if (passwordChanged) {
        toast({
            title: "Password Updated",
            description: "Your password has been successfully changed.",
        });
      } else {
         toast({
            title: "No Changes",
            description: "No changes were submitted.",
            variant: "default"
        });
      }
      
      // Reset password fields after successful submission
      reset({ fullName: data.fullName, newPassword: '', confirmNewPassword: '' });

    } catch (error: any) {
        console.error("Error updating user profile/password:", error);
        toast({
            title: "Update Failed",
            description: error.message || "Could not update your profile/password. Please try again.",
            variant: "destructive",
        });
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
        <p className="text-lg text-muted-foreground">Update your account information and password.</p>
      </section>

      <Card className="max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Your Details</CardTitle>
          <CardDescription>Keep your profile information and password up to date.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Profile Photo Section */}
            <div className="space-y-4">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profilePhotoUrl ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                      <Image
                        src={profilePhotoUrl}
                        alt="Profile photo"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      <button
                        type="button"
                        onClick={removeProfilePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                        aria-label="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading || submitLoading || !isSupabaseConfigured}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || submitLoading || !isSupabaseConfigured}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email || ''} autoComplete="email" disabled className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Your email address cannot be changed here.</p>
            </div>
            
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                placeholder="Enter your full name" 
                autoComplete="name"
                {...register("fullName")}
                disabled={submitLoading || !isSupabaseConfigured}
              />
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            
            <Separator className="my-6" />

            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold font-headline">Change Password</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Leave these fields blank if you do not want to change your password.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password" 
                placeholder="Enter new password (min. 6 characters)" 
                autoComplete="new-password"
                {...register("newPassword")}
                disabled={submitLoading || !isSupabaseConfigured}
              />
              {errors.newPassword && <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input 
                id="confirmNewPassword" 
                type="password" 
                placeholder="Confirm new password" 
                autoComplete="new-password"
                {...register("confirmNewPassword")}
                disabled={submitLoading || !isSupabaseConfigured}
              />
              {errors.confirmNewPassword && <p className="text-sm text-destructive mt-1">{errors.confirmNewPassword.message}</p>}
            </div>
            
            <Alert variant="default" className="mt-4 p-3 text-xs bg-muted/30 border-primary/30">
                <Info className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
                <AlertTitle className="font-semibold">Security Note</AlertTitle>
                <AlertDescription>
                 If you&apos;ve forgotten your current password and cannot log in, please use the <Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot Password</Link> option.
                </AlertDescription>
            </Alert>

          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitLoading || !isSupabaseConfigured}>
              {submitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

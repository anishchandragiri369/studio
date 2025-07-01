"use client";

import { useAuth } from '@/context/AuthContext';
import { User, LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface UserProfilePhotoProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showLoginPrompt?: boolean;
  className?: string;
}

const UserProfilePhoto = ({ 
  size = 'md', 
  showName = false, 
  showLoginPrompt = true,
  className = '' 
}: UserProfilePhotoProps) => {
  const { user, loading } = useAuth();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-muted animate-pulse ${className}`} />
    );
  }

  if (!user) {
    if (!showLoginPrompt) return null;
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center`}>
          <User className={iconSizes[size]} />
        </div>
        {showName && (
          <div className="flex flex-col">
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <Link href="/login">
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const profilePhotoUrl = user.user_metadata?.profile_photo_url;
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all`}>
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              alt={`${fullName}'s profile`}
              width={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
              height={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
              className="object-cover w-full h-full"
            />
          ) : (
            <User className={iconSizes[size]} />
          )}
        </div>
        {showName && (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Welcome, {fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              View Profile
            </span>
          </div>
        )}
      </Link>
    </div>
  );
};

export default UserProfilePhoto;

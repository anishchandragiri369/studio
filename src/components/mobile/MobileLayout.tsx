"use client";

import { useEffect, useState } from 'react';
import { MobileUtils } from '@/lib/mobile';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isNative, setIsNative] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    const checkMobile = () => {
      setIsNative(MobileUtils.isNative());
      setPlatform(MobileUtils.getPlatform());
    };

    checkMobile();

    // Add mobile-specific CSS classes
    if (MobileUtils.isNative()) {
      document.body.classList.add('mobile-app');
      document.body.classList.add(`platform-${MobileUtils.getPlatform()}`);
    }

    // Handle app lifecycle events
    const handleAppForeground = () => {
      console.log('App came to foreground');
      // Refresh data or update UI
    };

    const handleAppBackground = () => {
      console.log('App went to background');
      // Save state or pause operations
    };

    window.addEventListener('app-foreground', handleAppForeground);
    window.addEventListener('app-background', handleAppBackground);

    return () => {
      window.removeEventListener('app-foreground', handleAppForeground);
      window.removeEventListener('app-background', handleAppBackground);
    };
  }, []);

  return (
    <div 
      className={`min-h-screen ${isNative ? 'mobile-native' : 'web-browser'} platform-${platform}`}
      style={{
        // Add safe area handling for iOS
        paddingTop: isNative && platform === 'ios' ? 'env(safe-area-inset-top)' : '0',
        paddingBottom: isNative && platform === 'ios' ? 'env(safe-area-inset-bottom)' : '0',
      }}
    >
      {children}
    </div>
  );
}

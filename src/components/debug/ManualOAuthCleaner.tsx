"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Manual OAuth URL Cleaner - for testing/debugging
 * Shows a button to manually clean OAuth tokens from URL
 */
export default function ManualOAuthCleaner() {
  const [showCleaner, setShowCleaner] = useState(false);

  useEffect(() => {
    // Show cleaner if OAuth tokens are in URL
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setShowCleaner(true);
    }
  }, []);

  const cleanUrl = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setShowCleaner(false);
    }
  };

  if (!showCleaner) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-yellow-800">OAuth tokens in URL</span>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={cleanUrl}
          className="h-6 px-2 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Clean URL
        </Button>
      </div>
    </div>
  );
}

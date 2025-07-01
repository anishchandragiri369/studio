"use client";

import { useState } from 'react';

/**
 * ClearCacheButton - Emergency cache clearing utility
 * Can be added to support pages or admin panels
 */
export default function ClearCacheButton({ className = "" }: { className?: string }) {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const clearAllCache = async () => {
    if (isClearing) return;
    
    setIsClearing(true);
    
    try {
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      setLastCleared(new Date());
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Error clearing cache. Please try manually clearing your browser data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={clearAllCache}
        disabled={isClearing}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors
          ${isClearing 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-red-500 hover:bg-red-600 text-white'
          }
        `}
      >
        {isClearing ? 'Clearing Cache...' : 'Clear Browser Cache'}
      </button>
      
      {lastCleared && (
        <p className="text-sm text-green-600">
          Cache cleared at {lastCleared.toLocaleTimeString()}. Page will reload...
        </p>
      )}
      
      <p className="text-xs text-gray-500">
        This will clear all browser data and reload the page. Use this if you're experiencing login issues.
      </p>
    </div>
  );
}

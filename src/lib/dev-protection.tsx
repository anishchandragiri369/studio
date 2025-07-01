/**
 * Development Protection Utilities
 * Prevents test pages and development features from being accessible in production
 */

import React from 'react';

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.ENABLE_DEV_FEATURES === 'true';
}

export function isTestingMode(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.ENABLE_TESTING === 'true';
}

export function shouldAllowDevAccess(): boolean {
  return isDevelopmentMode() || isTestingMode();
}

/**
 * Component to protect dev/test pages from production access
 */
export function DevProtectionWrapper({ children }: { children: React.ReactNode }) {
  if (!shouldAllowDevAccess()) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This page is only available in development mode.
          </p>
          <a 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Server-side protection for API routes
 */
export function checkDevAccess(): { allowed: boolean; response?: Response } {
  if (!shouldAllowDevAccess()) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ 
          error: 'Access denied', 
          message: 'This endpoint is only available in development mode' 
        }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    };
  }
  
  return { allowed: true };
}

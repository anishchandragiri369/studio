"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function OrderSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();
  const { user, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cartCleared, setCartCleared] = useState(false);
  const [sessionRestoreAttempted, setSessionRestoreAttempted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle session restoration after payment redirect
  useEffect(() => {
    const handleSessionRestore = async () => {
      if (sessionRestoreAttempted) return;
      setSessionRestoreAttempted(true);
      
      try {
        console.log('[OrderSuccess] Attempting session restoration...');
        
        if (!supabase) {
          console.error('[OrderSuccess] Supabase client not available');
          setAuthError('Authentication service unavailable');
          return;
        }
        
        // First, check for any hash fragments or URL params that might contain session info
        const hashFragment = window.location.hash;
        const urlParams = new URLSearchParams(window.location.search);
        
        if (hashFragment.includes('access_token') || hashFragment.includes('refresh_token')) {
          console.log('[OrderSuccess] Found auth tokens in URL hash, letting Supabase handle it');
          // Supabase will automatically handle this, just wait a moment
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Try multiple approaches to restore session
        let sessionRestored = false;
        
        // Approach 1: Check current session
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('[OrderSuccess] Session error:', sessionError);
            
            if (sessionError.message?.includes('refresh_token_not_found') || 
                sessionError.message?.includes('Invalid Refresh Token') ||
                sessionError.message?.includes('JWT expired')) {
              console.log('[OrderSuccess] Refresh token invalid, attempting cleanup and recovery');
              
              // Approach 2: Try silent refresh first
              try {
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (!refreshError && refreshData.session) {
                  console.log('[OrderSuccess] Session refreshed successfully');
                  sessionRestored = true;
                } else {
                  console.log('[OrderSuccess] Refresh failed, clearing stale auth data');
                  
                  // Clear any stale auth data
                  await supabase.auth.signOut({ scope: 'local' });
                  
                  // Remove any stale localStorage entries
                  if (typeof window !== 'undefined') {
                    const authKeys = Object.keys(localStorage).filter(key => 
                      key.includes('supabase') || key.includes('auth')
                    );
                    authKeys.forEach(key => {
                      try {
                        localStorage.removeItem(key);
                      } catch (e) {
                        console.warn('[OrderSuccess] Failed to remove localStorage key:', key);
                      }
                    });
                  }
                  
                  setAuthError('Session expired after payment. Please log in again to access your account features.');
                }
              } catch (refreshErr) {
                console.error('[OrderSuccess] Session refresh failed:', refreshErr);
                setAuthError('Unable to restore session after payment. Please log in again.');
              }
            } else {
              // Other session errors
              setAuthError(`Authentication error: ${sessionError.message}`);
            }
          } else if (session) {
            console.log('[OrderSuccess] Valid session found:', session.user?.email);
            sessionRestored = true;
          } else {
            console.log('[OrderSuccess] No session found, user may need to log in again');
            setAuthError('No active session found. Please log in again to access your account.');
          }
        } catch (sessionCheckError) {
          console.error('[OrderSuccess] Session check failed:', sessionCheckError);
          setAuthError('Failed to check authentication status.');
        }
        
        // Approach 3: If nothing worked, try to recover from URL parameters
        if (!sessionRestored && (urlParams.has('session') || hashFragment.includes('session'))) {
          console.log('[OrderSuccess] Attempting to recover from URL parameters');
          try {
            // Wait a bit more for automatic session recovery
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            if (finalSession) {
              console.log('[OrderSuccess] Session recovered from URL');
              sessionRestored = true;
              setAuthError(null);
            }
          } catch (urlRecoveryError) {
            console.error('[OrderSuccess] URL recovery failed:', urlRecoveryError);
          }
        }
        
      } catch (error) {
        console.error('[OrderSuccess] Session restore failed:', error);
        setAuthError('Session restoration failed. Please refresh the page or log in again.');
      }
    };

    // Small delay to allow any URL-based auth to complete first
    const timer = setTimeout(handleSessionRestore, 1000);
    return () => clearTimeout(timer);
  }, [sessionRestoreAttempted]);

  useEffect(() => {
    // Set page title
    document.title = 'Order Successful - Elixr';
    
    // Clear the cart after successful order completion
    if (!cartCleared) {
      clearCart(false); // Clear cart without showing toast since we're on success page
      setCartCleared(true);
    }
  }, [clearCart, cartCleared]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      if (!supabase) {
        console.error('[OrderSuccess] Supabase client not available for manual refresh');
        setAuthError('Authentication service unavailable');
        return;
      }
      
      console.log('[OrderSuccess] Attempting manual session refresh...');
      setAuthError(null);
      
      // Try multiple recovery approaches
      try {
        // First attempt: refresh session
        const { data: refreshData, error } = await supabase.auth.refreshSession();
        if (!error && refreshData.session) {
          console.log('[OrderSuccess] Manual refresh successful');
          setAuthError(null);
          // Small delay before reload to let state update
          setTimeout(() => window.location.reload(), 500);
          return;
        }
      } catch (refreshErr) {
        console.log('[OrderSuccess] Refresh failed, trying recovery...');
      }
      
      // Second attempt: clear and reload
      try {
        await supabase.auth.signOut({ scope: 'local' });
        console.log('[OrderSuccess] Cleared local auth state');
      } catch (signOutErr) {
        console.warn('[OrderSuccess] Sign out failed:', signOutErr);
      }
      
      // Force page reload to start fresh
      window.location.reload();
    } catch (error) {
      console.error('[OrderSuccess] Manual refresh error:', error);
      setAuthError('Manual refresh failed. Please try refreshing the page.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Monitor auth state changes and clear errors when user is restored
  useEffect(() => {
    if (user && authError) {
      console.log('[OrderSuccess] User restored, clearing auth error');
      setAuthError(null);
    }
  }, [user, authError]);

  // Show loading state during session restoration
  if (loading || !sessionRestoreAttempted) {
    return (
      <div className="container mx-auto px-4 py-12 mobile-container">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="shadow-lg">
            <CardContent className="py-16">
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                <h2 className="text-xl font-headline font-bold">Processing Your Order</h2>
                <p className="text-muted-foreground">
                  Please wait while we restore your session and confirm your order...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 mobile-container">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">
              Order Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase! Your order has been confirmed and is being processed.
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We&apos;ll send you an email confirmation with your order details and tracking information once your order ships.
              </p>
              
              {/* Show authentication error or recovery options */}
              {authError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 font-medium mb-1">
                        Authentication Notice
                      </p>
                      <p className="text-sm text-yellow-700 mb-3">
                        {authError}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          onClick={handleRefreshSession}
                          disabled={isRefreshing}
                          variant="outline"
                          size="sm"
                          className="bg-white"
                        >
                          {isRefreshing ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Try Recovery
                        </Button>
                        <Button 
                          asChild
                          variant="outline"
                          size="sm"
                          className="bg-white"
                        >
                          <Link href="/login">
                            Log In
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show refresh button if there are auth issues but no specific error */}
              {!authError && !loading && !user && sessionRestoreAttempted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-medium mb-1">
                        Session Recovery
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        Some features may not work properly. You can continue browsing or try to restore your session.
                      </p>
                      <Button 
                        onClick={handleRefreshSession}
                        disabled={isRefreshing}
                        variant="outline"
                        size="sm"
                        className="bg-white"
                      >
                        {isRefreshing ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Restore Session
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Additional helpful links */}
              <div className="border-t pt-4 mt-6">
                <p className="text-xs text-muted-foreground mb-2">
                  Having trouble? You can also:
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/faq">View FAQ</Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full sm:w-auto"
                >
                  <Link 
                    href="/"
                    onClick={(e) => {
                      // Only use window.location as last resort for severe auth issues
                      if (authError && authError.includes('refresh_token_not_found')) {
                        e.preventDefault();
                        window.location.href = '/';
                      }
                      // Let Next.js handle navigation in most cases
                    }}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Return Home
                  </Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full sm:w-auto"
                  variant={!user && !loading ? "outline" : "default"}
                >
                  <Link 
                    href={user ? "/orders" : "/login"}
                    onClick={(e) => {
                      // Only prevent default if there are clear auth issues
                      if (!user && !loading && authError) {
                        e.preventDefault();
                        // Use router.push for better navigation
                        router.push('/login?redirect=/orders');
                      }
                      // Let Next.js handle navigation in all other cases
                    }}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {user ? "View Orders" : "Log In to View Orders"}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
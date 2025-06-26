"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user, loading, isSupabaseConfigured, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/admin/analytics');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router, isSupabaseConfigured]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Configuration Required</AlertTitle>
          <AlertDescription>
            Admin features are currently unavailable due to system configuration issues.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Analytics Dashboard
            </CardTitle>
            <CardDescription>
              Comprehensive analytics for coupon usage, referral performance, and reward system metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Welcome, {user.user_metadata?.full_name || user.email}. Monitor your coupon and referral system performance below.
            </p>
          </CardContent>
        </Card>

        <AnalyticsDashboard />
      </div>
    </div>
  );
}

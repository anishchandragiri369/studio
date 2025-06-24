"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Calendar, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import SubscriptionCard from '@/components/subscriptions/SubscriptionCard';
import type { UserSubscription } from '@/lib/types';

export default function MySubscriptionsPage() {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/subscriptions/user?userId=${user.id}`);
      const result = await response.json();

      if (result.success) {
        setSubscriptions(result.data);
      } else {
        setError(result.message || 'Failed to fetch subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('An unexpected error occurred while fetching your subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'My Subscriptions - Elixr';
    }
  }, []);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchSubscriptions();
    }
  }, [user, isSupabaseConfigured]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscriptions Unavailable</AlertTitle>
          <AlertDescription>
            Subscription management is currently disabled due to a configuration issue. Please try again later.
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link href="/account">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12 text-center">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please log in to view your subscriptions.</p>
        <Button asChild>
          <Link href="/login?redirect=/my-subscriptions">Log In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Subscriptions</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={fetchSubscriptions} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            Retry Loading Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <Button variant="outline" asChild className="mb-8">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Account
          </Link>
        </Button>

        <section className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
            My Subscriptions
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your juice subscriptions - pause, resume, or modify your delivery schedule.
          </p>
        </section>

        {subscriptions.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No Subscriptions Found</CardTitle>
              <CardDescription>
                You don't have any active subscriptions yet. Start a subscription to enjoy regular deliveries of fresh juices.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/subscriptions">Browse Subscription Plans</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Subscription Management Rules</AlertTitle>
              <AlertDescription>
                • You may pause your subscription at any time with 24 hours notice before next delivery.<br />
                • Subscription can be reactivated within 3 months from pause date.<br />
                • After 3 months, paused subscriptions will expire and cannot be reactivated.
              </AlertDescription>
            </Alert>

            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onUpdate={fetchSubscriptions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

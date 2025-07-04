"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UserSubscription, UserFruitBowlSubscription } from '@/lib/types';
import { 
  Calendar, 
  Package, 
  Pause, 
  Play, 
  Settings, 
  Loader2, 
  AlertTriangle,
  Apple,
  Coffee,
  Clock,
  MapPin 
} from 'lucide-react';
import Link from 'next/link';

export default function AccountSubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [juiceSubscriptions, setJuiceSubscriptions] = useState<UserSubscription[]>([]);
  const [fruitBowlSubscriptions, setFruitBowlSubscriptions] = useState<UserFruitBowlSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account/subscriptions');
      return;
    }

    if (user) {
      fetchSubscriptions();
    }
  }, [user, authLoading, router]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const [juiceResponse, fruitBowlResponse] = await Promise.all([
        fetch('/api/subscriptions/user'),
        fetch('/api/fruit-bowls/subscriptions')
      ]);

      // Handle juice subscriptions
      if (juiceResponse.ok) {
        const juiceData = await juiceResponse.json();
        setJuiceSubscriptions(juiceData.subscriptions || []);
      }

      // Handle fruit bowl subscriptions
      if (fruitBowlResponse.ok) {
        const fruitBowlData = await fruitBowlResponse.json();
        setFruitBowlSubscriptions(fruitBowlData.subscriptions || []);
      }

    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async (subscriptionId: string, type: 'juice' | 'fruit-bowl') => {
    try {
      const endpoint = type === 'juice' 
        ? '/api/subscriptions/pause' 
        : '/api/fruit-bowls/subscriptions/pause';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      if (response.ok) {
        fetchSubscriptions(); // Refresh the data
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
    }
  };

  const handleResumeSubscription = async (subscriptionId: string, type: 'juice' | 'fruit-bowl') => {
    try {
      const endpoint = type === 'juice' 
        ? '/api/subscriptions/reactivate' 
        : '/api/fruit-bowls/subscriptions/reactivate';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId })
      });

      if (response.ok) {
        fetchSubscriptions(); // Refresh the data
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
    }
  };

  if (!user && !authLoading) {
    return null;
  }

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your subscriptions...</span>
        </div>
      </div>
    );
  }

  const totalSubscriptions = juiceSubscriptions.length + fruitBowlSubscriptions.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your juice and fruit bowl subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/subscriptions">
            <Button variant="outline">
              <Coffee className="h-4 w-4 mr-2" />
              Subscribe to Juices
            </Button>
          </Link>
          <Link href="/subscriptions">
            <Button>
              <Apple className="h-4 w-4 mr-2" />
              Subscribe to Fruit Bowls
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {totalSubscriptions === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Subscriptions</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start your wellness journey with our nutritious juice cleanses and fresh fruit bowls.
            </p>
            <div className="flex gap-3">
              <Link href="/subscriptions">
                <Button variant="outline">Browse Juice Plans</Button>
              </Link>
              <Link href="/subscriptions">
                <Button>Browse Fruit Bowl Plans</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Juice Subscriptions */}
          {juiceSubscriptions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Coffee className="h-6 w-6 mr-2" />
                Juice Subscriptions ({juiceSubscriptions.length})
              </h2>
              <div className="grid gap-4">
                {juiceSubscriptions.map((subscription) => (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          Juice Subscription
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status}
                          </Badge>
                        </CardTitle>
                        <div className="flex gap-2">
                          {subscription.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseSubscription(subscription.id, 'juice')}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResumeSubscription(subscription.id, 'juice')}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Plan</p>
                          <p className="capitalize">{subscription.delivery_frequency} Plan</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Next Delivery</p>
                          <p className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {subscription.next_delivery_date 
                              ? new Date(subscription.next_delivery_date).toLocaleDateString()
                              : 'Not scheduled'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                          <p className="font-semibold">₹{subscription.total_amount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Fruit Bowl Subscriptions */}
          {fruitBowlSubscriptions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Apple className="h-6 w-6 mr-2" />
                Fruit Bowl Subscriptions ({fruitBowlSubscriptions.length})
              </h2>
              <div className="grid gap-4">
                {fruitBowlSubscriptions.map((subscription) => (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {subscription.plan?.name || 'Fruit Bowl Subscription'}
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status}
                          </Badge>
                        </CardTitle>
                        <div className="flex gap-2">
                          {subscription.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseSubscription(subscription.id, 'fruit-bowl')}
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResumeSubscription(subscription.id, 'fruit-bowl')}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Plan</p>
                          <p className="capitalize">{subscription.plan?.frequency} Plan</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Duration</p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {subscription.plan?.duration_weeks} week{subscription.plan?.duration_weeks !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Next Delivery</p>
                          <p className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {subscription.next_delivery_date 
                              ? new Date(subscription.next_delivery_date).toLocaleDateString()
                              : 'Not scheduled'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                          <p className="font-semibold">₹{subscription.total_amount}</p>
                        </div>
                      </div>

                      {subscription.delivery_address && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Delivery Address</p>
                          <p className="text-sm flex items-start gap-1">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>
                              {typeof subscription.delivery_address === 'object' ? (
                                <>
                                  {subscription.delivery_address.addressLine1}, {subscription.delivery_address.city}, {subscription.delivery_address.state} - {subscription.delivery_address.zipCode}
                                </>
                              ) : (
                                subscription.delivery_address
                              )}
                            </span>
                          </p>
                        </div>
                      )}

                      {subscription.special_instructions && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground">Special Instructions</p>
                          <p className="text-sm">{subscription.special_instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

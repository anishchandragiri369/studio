"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export default function TestSubscriptionPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const testSubscriptionCreation = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test subscription creation.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const testPayload = {
        userId: user.id,
        planId: 'premium',
        planName: 'Premium Plan',
        planPrice: 480,
        planFrequency: 'weekly',
        customerInfo: {
          name: 'Test User',
          email: user.email,
          phone: '1234567890',
          address: {
            line1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'India'
          }
        },
        selectedJuices: [
          { juiceId: '1', quantity: 2 },
          { juiceId: '2', quantity: 1 }
        ],
        subscriptionDuration: 6,
        basePrice: 120
      };

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Subscription Created Successfully!",
          description: `Subscription ID: ${result.data.subscription.id}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Subscription Creation Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing subscription creation:', error);
      toast({
        title: "Error",
        description: "Failed to test subscription creation.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const testOrderCreation = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test order creation.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const testOrderPayload = {
        orderAmount: 633.60,
        orderItems: [
          { id: '1', juiceId: '1', name: 'Rejoice', quantity: 2, pricePerItem: 120 },
          { id: '2', juiceId: '2', name: 'Green Vitality', quantity: 1, pricePerItem: 120 }
        ],
        customerInfo: {
          name: 'Test User',
          email: user.email,
          phone: '1234567890',
        },
        userId: user.id,
        subscriptionData: {
          planId: 'premium',
          planName: 'Premium Plan',
          planPrice: 633.60,
          planFrequency: 'weekly',
          selectedJuices: [
            { juiceId: '1', quantity: 2 },
            { juiceId: '2', quantity: 1 }
          ],
          subscriptionDuration: 6,
          basePrice: 120
        }
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testOrderPayload)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Order & Subscription Created!",
          description: `Order ID: ${result.data.id}${result.data.subscription ? `, Subscription ID: ${result.data.subscription.subscription.id}` : ''}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Order Creation Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing order creation:', error);
      toast({
        title: "Error",
        description: "Failed to test order creation.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">        <CardHeader>
          <CardTitle>Test Subscription System</CardTitle>
          <CardDescription>
            ⚠️ <strong>IMPORTANT:</strong> Subscriptions are now only created after successful payment.
            Orders and subscriptions will only appear in your account after payment confirmation.
            Make sure you've run the SQL migrations first!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <p className="text-muted-foreground">Please log in to test the subscription system.</p>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Current User:</h3>
                <p className="text-sm text-muted-foreground">
                  {user.email} (ID: {user.id})
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Test Direct Subscription Creation</h3>
                  <Button 
                    onClick={testSubscriptionCreation}
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Test Subscription API'}
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Test Order + Subscription Creation</h3>
                  <Button 
                    onClick={testOrderCreation}
                    disabled={isCreating}
                    variant="outline"
                    className="w-full"
                  >
                    {isCreating ? 'Creating...' : 'Test Order + Subscription API'}
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">After testing:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check your <a href="/my-subscriptions" className="text-primary hover:underline">subscriptions page</a></li>
                  <li>• Check your <a href="/orders" className="text-primary hover:underline">orders page</a></li>
                  <li>• Verify data in Supabase dashboard</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

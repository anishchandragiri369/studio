"use client";

import { useState } from 'react';
import { apiPost } from '@/lib/apiUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLogger } from '@/hooks/useLogger';
import { DevProtectionWrapper } from '@/lib/dev-protection';

export default function TestSubscriptionPage() {
  return (
    <DevProtectionWrapper>
      <TestSubscriptionContent />
    </DevProtectionWrapper>
  );
}

function TestSubscriptionContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { logApiResponse, logInfo, logError } = useLogger();
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
            city: 'Hyderabad',
            state: 'Telangana',
            zipCode: '500001',
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

      logInfo('Starting subscription creation test', testPayload, 'Test Page');
      const result = await apiPost('/api/subscriptions/create', testPayload);
      logApiResponse(result, '/api/subscriptions/create');

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
      logError('Error testing subscription creation', { error: error instanceof Error ? error.message : error }, 'Test Page');
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
          address: {
            street: '123 Test Street',
            city: 'Hyderabad',
            state: 'Telangana',
            zipCode: '500001',
            country: 'India'
          }
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

      logInfo('Starting order creation test', testOrderPayload, 'Test Page');
      const result = await apiPost('/api/orders/create', testOrderPayload);
      logApiResponse(result, '/api/orders/create');

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
      logError('Error testing order creation', { error: error instanceof Error ? error.message : error }, 'Test Page');
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
                <h4 className="font-semibold mb-2">Debugging & Monitoring:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• View real-time logs in the <a href="/logs" className="text-primary hover:underline font-semibold">Browser Log Viewer</a></li>
                  <li>• Check detailed data in the <a href="/debug" className="text-primary hover:underline font-semibold">Debug Dashboard</a></li>
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

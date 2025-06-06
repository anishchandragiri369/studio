"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/constants'; // Assuming plans are here
import type { SubscriptionPlan } from '@/lib/types';

function SubscribePageContents() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  if (typeof window !== 'undefined') {
    document.title = selectedPlan ? `Subscribe to ${selectedPlan.name} - Elixir` : 'Choose a Subscription - Elixir';
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/subscriptions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Plans
        </Link>
      </Button>

      {selectedPlan ? (
        <Card className="max-w-2xl mx-auto shadow-xl animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Confirm Your Subscription</CardTitle>
            <CardDescription>You are about to subscribe to the following plan:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted/50 rounded-lg">
              <h2 className="text-2xl font-semibold font-headline mb-2">{selectedPlan.name}</h2>
              <p className="text-muted-foreground capitalize mb-1">{selectedPlan.frequency} Delivery</p>
              <p className="text-2xl font-bold text-primary mb-3">
                ${selectedPlan.pricePerDelivery.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedPlan.frequency === 'weekly' ? 'week' : 'month'}
                </span>
              </p>
              <p className="text-sm">{selectedPlan.description}</p>
              {selectedPlan.defaultJuices && selectedPlan.defaultJuices.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-1">Includes:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {selectedPlan.defaultJuices.map(dj => (
                      // In a real app, you'd look up juice names from their IDs
                      <li key={dj.juiceId}>{dj.quantity}x Juice (ID: {dj.juiceId})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            
            <div className="text-center p-4 border-dashed border-2 border-primary/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
              <p className="text-muted-foreground mb-4">
                This is where the payment and confirmation steps would go.
                For now, you can proceed to checkout.
              </p>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/checkout">
                  <ShoppingCart className="mr-2 h-5 w-5" /> Proceed to Checkout
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-lg mx-auto shadow-xl text-center animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-destructive">Plan Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              The subscription plan you selected could not be found. Please try again or select another plan.
            </p>
            <Button asChild>
              <Link href="/subscriptions">View Subscription Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SubscribePage() {
  // Suspense is required by Next.js when using useSearchParams in a client component
  // during the initial render pass.
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading plan details...</div>}>
      <SubscribePageContents />
    </Suspense>
  );
}

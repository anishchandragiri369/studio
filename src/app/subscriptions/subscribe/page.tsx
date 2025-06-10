
"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { SUBSCRIPTION_PLANS, JUICES } from '@/lib/constants';
import type { SubscriptionPlan, Juice } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

type CustomSelections = Record<string, number>; // { juiceId: quantity }

function SubscribePageContents() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan');
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  const [customSelections, setCustomSelections] = useState<CustomSelections>({});
  const [totalSelectedJuices, setTotalSelectedJuices] = useState(0);

  useEffect(() => {
    if (selectedPlan && selectedPlan.isCustomizable && selectedPlan.defaultJuices) {
      const initialSelections: CustomSelections = {};
      let initialTotal = 0;
      selectedPlan.defaultJuices.forEach(dj => {
        initialSelections[dj.juiceId] = dj.quantity;
        initialTotal += dj.quantity;
      });
      setCustomSelections(initialSelections);
      setTotalSelectedJuices(initialTotal);
    } else {
      setCustomSelections({});
      setTotalSelectedJuices(0);
    }
  }, [selectedPlan]);
  
  useEffect(() => {
    const currentTotal = Object.values(customSelections).reduce((sum, qty) => sum + qty, 0);
    setTotalSelectedJuices(currentTotal);
  }, [customSelections]);

  if (typeof window !== 'undefined') {
    document.title = selectedPlan ? `Subscribe to ${selectedPlan.name} - Elixr` : 'Choose a Subscription - Elixr';
  }

  const handleQuantityChange = (juiceId: string, newQuantity: number) => {
    const currentQty = customSelections[juiceId] || 0;
    const diff = newQuantity - currentQty;
    
    if (selectedPlan?.maxJuices && (totalSelectedJuices + diff > selectedPlan.maxJuices) && diff > 0) {
      // alert(`You can select a maximum of ${selectedPlan.maxJuices} juices for this plan.`);
      return; // Do nothing if adding would exceed max limit
    }

    setCustomSelections(prev => {
      const updatedSelections = { ...prev };
      if (newQuantity > 0) {
        updatedSelections[juiceId] = newQuantity;
      } else {
        delete updatedSelections[juiceId];
      }
      return updatedSelections;
    });
  };

  const canAddMore = selectedPlan?.maxJuices ? totalSelectedJuices < selectedPlan.maxJuices : true;

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
              <h2 className="text-2xl font-semibold font-headline mb-2 text-primary">{selectedPlan.name}</h2>
              <p className="text-muted-foreground capitalize mb-1">{selectedPlan.frequency} Delivery</p>
              <p className="text-2xl font-bold text-accent mb-3">
                Rs.{selectedPlan.pricePerDelivery.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedPlan.frequency === 'weekly' ? 'week' : 'month'}
                </span>
              </p>
              <p className="text-sm">{selectedPlan.description}</p>
              {!selectedPlan.isCustomizable && selectedPlan.defaultJuices && selectedPlan.defaultJuices.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-1">Includes:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {selectedPlan.defaultJuices.map(dj => {
                      const juiceInfo = JUICES.find(j => j.id === dj.juiceId);
                      return (
                         <li key={dj.juiceId}>{dj.quantity}x {juiceInfo ? juiceInfo.name : `Juice (ID: ${dj.juiceId})`}</li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {selectedPlan.isCustomizable && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary">Customize Your Juices</CardTitle>
                  {selectedPlan.maxJuices && (
                    <CardDescription>
                      Select up to {selectedPlan.maxJuices} juices. You have selected {totalSelectedJuices} / {selectedPlan.maxJuices}.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {JUICES.map(juice => (
                    <div key={juice.id} className="flex items-center justify-between gap-4 p-3 border rounded-md hover:bg-muted/20">
                      <div className="flex items-center gap-3">
                        <Image src={juice.image} alt={juice.name} width={80} height={80} className="rounded-md object-cover" data-ai-hint={juice.dataAiHint || juice.name.toLowerCase()} />
                        <div>
                          <p className="font-medium text-sm">{juice.name}</p>
                          <p className="text-xs text-muted-foreground">Rs.{juice.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(juice.id, (customSelections[juice.id] || 0) - 1)}
                          disabled={(customSelections[juice.id] || 0) === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number"
                          value={customSelections[juice.id] || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) handleQuantityChange(juice.id, val < 0 ? 0 : val );
                          }}
                          className="w-12 h-7 text-center text-sm px-1"
                          min="0"
                          disabled={!canAddMore && (customSelections[juice.id] || 0) === 0}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(juice.id, (customSelections[juice.id] || 0) + 1)}
                          disabled={!canAddMore}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
                 {selectedPlan.maxJuices && totalSelectedJuices > selectedPlan.maxJuices && (
                    <CardFooter>
                        <p className="text-destructive text-sm">You have selected more than the allowed {selectedPlan.maxJuices} juices. Please reduce your selection.</p>
                    </CardFooter>
                )}
              </Card>
            )}
            
            <Separator />
            
            <div className="text-center p-4 border-dashed border-2 border-primary/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
              <p className="text-muted-foreground mb-4">
                Confirm your selections and proceed to checkout.
              </p>
              <Button 
                asChild 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={selectedPlan.isCustomizable && selectedPlan.maxJuices && totalSelectedJuices > selectedPlan.maxJuices}
              >
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
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading plan details...</div>}>
      <SubscribePageContents />
    </Suspense>
  );
}


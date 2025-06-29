"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { SUBSCRIPTION_PLANS, JUICES } from '@/lib/constants';
import SubscriptionDurationSelector from '@/components/subscriptions/SubscriptionDurationSelector';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import type { SubscriptionPlan, Juice } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';

type CustomSelections = Record<string, number>; // { juiceId: quantity }

function SubscribePageContents() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter
  const { addSubscriptionToCart } = useCart(); // Add cart functionality
  const planId = searchParams.get('plan');
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  const [customSelections, setCustomSelections] = useState<CustomSelections>({});
  const [totalSelectedJuices, setTotalSelectedJuices] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 3 | 4 | 6 | 12>(selectedPlan?.frequency === 'weekly' ? 2 : 3);
  const [selectedPricing, setSelectedPricing] = useState<any>(null);
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
    }    // Initialize pricing when plan loads
    if (selectedPlan) {
      const initialPricing = SubscriptionManager.calculateSubscriptionPricing(
        selectedPlan.pricePerDelivery, 
        selectedDuration,
        selectedPlan.frequency
      );
      setSelectedPricing(initialPricing);
    }
  }, [selectedPlan, selectedDuration]);
  
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
  const handleDurationSelect = (duration: 1 | 2 | 3 | 4 | 6 | 12, pricing: any) => {
    setSelectedDuration(duration);
    setSelectedPricing(pricing);
  };
  const handleProceedToCheckout = () => {
    console.log('Adding subscription to cart');
    
    if (!selectedPlan) {
      console.error('No selected plan');
      return;
    }
    
    if (!selectedPricing) {
      console.error('No selected pricing - initializing now');
      // Try to initialize pricing if it's missing
      const pricing = SubscriptionManager.calculateSubscriptionPricing(
        selectedPlan.pricePerDelivery, 
        selectedDuration,
        selectedPlan.frequency
      );
      setSelectedPricing(pricing);
      
      // Use the calculated pricing for adding to cart
      const subscriptionData = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planFrequency: selectedPlan.frequency,
        subscriptionDuration: selectedDuration,
        basePrice: pricing.finalPrice, // Use final price with discount
        selectedJuices: selectedPlan.isCustomizable 
          ? Object.entries(customSelections).map(([juiceId, quantity]) => ({ juiceId, quantity }))
          : selectedPlan.defaultJuices || []
      };
      
      addSubscriptionToCart(subscriptionData);
      router.push('/cart');
      return;
    }

    // Add subscription to cart with proper data structure
    const subscriptionData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planFrequency: selectedPlan.frequency,
      subscriptionDuration: selectedDuration,
      basePrice: selectedPricing.finalPrice, // Use final price with discount
      selectedJuices: selectedPlan.isCustomizable 
        ? Object.entries(customSelections).map(([juiceId, quantity]) => ({ juiceId, quantity }))
        : selectedPlan.defaultJuices || []
    };
    
    addSubscriptionToCart(subscriptionData);
    router.push('/cart');
  };

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
              )}            </div>

            {/* Duration Selector */}            <div className="space-y-4">
              <SubscriptionDurationSelector
                basePrice={selectedPlan.pricePerDelivery}
                frequency={selectedPlan.frequency}
                selectedDuration={selectedDuration}
                onDurationSelect={handleDurationSelect}
              />
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
                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto p-4">
                  {JUICES.map(juice => (
                    <div key={juice.id} className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/20 transition-colors text-center">
                      <Image 
                        src={juice.image} 
                        alt={juice.name} 
                        width={80} 
                        height={80} 
                        className="rounded-lg object-contain shadow-md" 
                        data-ai-hint={juice.dataAiHint || juice.name.toLowerCase()}
                      />
                      <p className="font-medium text-sm mt-1">{juice.name}</p>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" // Slightly smaller buttons for vertical layout
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
                          className="w-12 h-8 text-center text-sm px-1" // Slightly smaller input
                          min="0"
                          disabled={!canAddMore && (customSelections[juice.id] || 0) === 0}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" // Slightly smaller buttons
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
              </p>              <Button 
                onClick={handleProceedToCheckout}
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={
                  !selectedPricing || 
                  (selectedPlan.isCustomizable && selectedPlan.maxJuices ? totalSelectedJuices > selectedPlan.maxJuices : false)
                }
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> 
                {!selectedPricing ? 'Loading...' : 'Add to Cart'}
              </Button>
              {!selectedPricing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Calculating pricing...
                </p>
              )}
              {selectedPricing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Total: ₹{selectedPricing.finalPrice?.toFixed(2)} 
                  {selectedPricing.discountAmount > 0 && (
                    <span className="text-green-600 ml-2">
                      (Save ₹{selectedPricing.discountAmount.toFixed(2)})
                    </span>
                  )}
                </p>
              )}
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


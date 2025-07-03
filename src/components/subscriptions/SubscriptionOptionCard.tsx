
"use client";

import type { SubscriptionPlan, FruitBowl } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Edit3, Apple, Droplets, Star } from 'lucide-react';
import Link from 'next/link';
import { JUICES } from '@/lib/constants'; // Import JUICES to resolve names
import { useState, useEffect } from 'react';

interface SubscriptionOptionCardProps {
  plan: SubscriptionPlan;
  isFeatured?: boolean;
}

const SubscriptionOptionCard = ({ plan, isFeatured = false }: SubscriptionOptionCardProps) => {
  const [fruitBowls, setFruitBowls] = useState<FruitBowl[]>([]);

  useEffect(() => {
    // Fetch fruit bowls to display names
    if (plan.defaultFruitBowls && plan.defaultFruitBowls.length > 0) {
      fetch('/api/fruit-bowls')
        .then(res => res.json())
        .then(data => {
          if (data.fruitBowls && Array.isArray(data.fruitBowls)) {
            setFruitBowls(data.fruitBowls);
          }
        })
        .catch(err => console.error('Error fetching fruit bowls:', err));
    }
  }, [plan.defaultFruitBowls]);

  return (
    <Card className={`h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg ${isFeatured ? 'border-2 border-primary relative ring-2 ring-primary/30' : 'bg-card'}`}>
      {isFeatured && (
        <div className="absolute -top-0 -right-2 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full shadow-md transform rotate-10 flex items-center gap-1">
          <Zap size={12} /> Popular
        </div>
      )}
      <CardHeader className="p-6">
        <div className="flex items-center gap-2 mb-2">
          {plan.planType === 'juice-only' && <Droplets className="h-5 w-5 text-blue-500" />}
          {plan.planType === 'fruit-bowl-only' && <Apple className="h-5 w-5 text-green-500" />}
          {plan.planType === 'customized' && <Star className="h-5 w-5 text-purple-500" />}
          <CardTitle className="font-headline text-2xl text-primary">{plan.name}</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground capitalize">
          {plan.frequency} Delivery • {plan.planType === 'juice-only' ? 'Juices Only' : plan.planType === 'fruit-bowl-only' ? 'Fruit Bowls Only' : 'Juices & Fruit Bowls'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-grow">
        <p className="text-3xl font-bold text-accent mb-4">
          Rs.{plan.pricePerDelivery.toFixed(2)}
          <span className="text-sm font-normal text-muted-foreground">/{plan.frequency === 'weekly' ? 'week' : 'month'}</span>
        </p>
        <p className="text-sm text-foreground/80 mb-4 min-h-[4.5em] line-clamp-3">{plan.description}</p>
        
        {plan.isCustomizable && (
          <div className="mb-4">
            <p className="flex items-center gap-2 text-sm text-primary font-medium">
              <Edit3 size={16} /> Fully customizable up to {plan.maxJuices} juices{plan.includesFruitBowls && plan.maxFruitBowls ? ` and ${plan.maxFruitBowls} fruit bowls` : ''}.
            </p>
          </div>
        )}

        {/* Display Juices */}
        {plan.defaultJuices && plan.defaultJuices.length > 0 && (
          <div className="space-y-1 text-sm mb-4">
            <h4 className="font-semibold mb-1">{plan.isCustomizable ? "Suggested starting juices:" : "Includes:"}</h4>
            {plan.defaultJuices.slice(0,3).map(dj => {
                 const juiceInfo = JUICES.find(j => j.id === dj.juiceId);
                 return (
                   <p key={dj.juiceId} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span>{dj.quantity}x {juiceInfo ? juiceInfo.name : `Juice ID: ${dj.juiceId}`}</span>
                   </p>
                 )
            })}
            {plan.defaultJuices.length > 3 && <p className="text-xs text-muted-foreground/80 ml-6">+ {plan.defaultJuices.length - 3} more</p>}
          </div>
        )}

        {/* Display Fruit Bowls */}
        {plan.defaultFruitBowls && plan.defaultFruitBowls.length > 0 && (
          <div className="space-y-1 text-sm mb-4">
            <h4 className="font-semibold mb-1">{plan.isCustomizable ? "Suggested starting fruit bowls:" : "Includes:"}</h4>
            {plan.defaultFruitBowls.slice(0,3).map(fb => {
                 const fruitBowlInfo = fruitBowls.find(f => f.id === fb.fruitBowlId);
                 return (
                   <p key={fb.fruitBowlId} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle size={16} className="text-orange-500 flex-shrink-0" />
                      <span>{fb.quantity}x {fruitBowlInfo ? fruitBowlInfo.name : `Fruit Bowl ID: ${fb.fruitBowlId}`}</span>
                   </p>
                 )
            })}
            {plan.defaultFruitBowls.length > 3 && <p className="text-xs text-muted-foreground/80 ml-6">+ {plan.defaultFruitBowls.length - 3} more</p>}
          </div>
        )}

        {/* Plan type specific information */}
        {plan.planType === 'fruit-bowl-only' && (
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold mb-1">Includes:</h4>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle size={16} className="text-orange-500 flex-shrink-0" />
              <span>Choice of fresh fruit bowls from our daily selection</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle size={16} className="text-orange-500 flex-shrink-0" />
              <span>Complete nutritional information</span>
            </p>
          </div>
        )}

        {plan.planType === 'customized' && (
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold mb-1">Includes:</h4>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
              <span>Mix of fresh juices and fruit bowls</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle size={16} className="text-purple-500 flex-shrink-0" />
              <span>Complete customization flexibility</span>
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
          <Link href={`/subscriptions/subscribe?plan=${plan.id}`}>Choose Plan</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionOptionCard;


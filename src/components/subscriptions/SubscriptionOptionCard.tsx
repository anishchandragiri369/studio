
"use client";

import type { SubscriptionPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Edit3 } from 'lucide-react';
import Link from 'next/link';
import { JUICES } from '@/lib/constants'; // Import JUICES to resolve names

interface SubscriptionOptionCardProps {
  plan: SubscriptionPlan;
  isFeatured?: boolean;
}

const SubscriptionOptionCard = ({ plan, isFeatured = false }: SubscriptionOptionCardProps) => {
  return (
    <Card className={`flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg ${isFeatured ? 'border-2 border-primary relative ring-2 ring-primary/30' : 'bg-card'}`}>
      {isFeatured && (
        <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full shadow-md transform rotate-12 flex items-center gap-1">
          <Zap size={14} /> Popular
        </div>
      )}
      <CardHeader className="p-6">
        <CardTitle className="font-headline text-2xl mb-2 text-primary">{plan.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground capitalize">{plan.frequency} Delivery</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-grow">
        <p className="text-3xl font-bold text-accent mb-4">
          ₹{plan.pricePerDelivery.toFixed(2)}
          <span className="text-sm font-normal text-muted-foreground">/{plan.frequency === 'weekly' ? 'week' : 'month'}</span>
        </p>
        <p className="text-sm text-foreground/80 mb-4 min-h-[4.5em] line-clamp-3">{plan.description}</p>
        
        {plan.isCustomizable && (
          <div className="mb-4">
            <p className="flex items-center gap-2 text-sm text-primary font-medium">
              <Edit3 size={16} /> Fully customizable up to {plan.maxJuices} juices.
            </p>
          </div>
        )}

        {plan.defaultJuices && plan.defaultJuices.length > 0 && (
          <div className="space-y-1 text-sm">
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

"use client";

import type { SubscriptionPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';

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
          ${plan.pricePerDelivery.toFixed(2)}
          <span className="text-sm font-normal text-muted-foreground">/{plan.frequency === 'weekly' ? 'week' : 'month'}</span>
        </p>
        <p className="text-sm text-foreground/80 mb-4 min-h-[4.5em] line-clamp-3">{plan.description}</p>
        {plan.defaultJuices && plan.defaultJuices.length > 0 && (
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold mb-1">Includes:</h4>
            {plan.defaultJuices.slice(0,3).map(dj => ( // Show first 3 default juices
                 <p key={dj.juiceId} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle size={16} className="text-green-500" />
                    {dj.quantity}x Juice ID: {dj.juiceId} {/* Replace with actual juice name if available */}
                 </p>
            ))}
            {plan.defaultJuices.length > 3 && <p className="text-xs text-muted-foreground/80">+ {plan.defaultJuices.length - 3} more</p>}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
          {/* Link to a specific subscription configuration page or a general sign-up */}
          <Link href={`/subscriptions/subscribe?plan=${plan.id}`}>Choose Plan</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionOptionCard;

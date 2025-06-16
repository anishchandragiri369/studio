"use client"; // Convert to client component

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Image from 'next/image';
import { SUBSCRIPTION_PLANS, MOCK_USER_TASTE_PREFERENCES, MOCK_USER_CONSUMPTION_HABITS, AVAILABLE_JUICE_NAMES_FOR_AI } from '@/lib/constants';
import SubscriptionOptionCard from '@/components/subscriptions/SubscriptionOptionCard';
// import { Metadata } from 'next'; // Metadata cannot be used directly in client components
import AISubscriptionRecommender from '@/components/subscriptions/AISubscriptionRecommender';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter } from 'lucide-react';

// export const metadata: Metadata = { // Cannot be used directly
//   title: 'Juice Subscriptions - Elixr',
//   description: 'Choose from our flexible weekly and monthly juice subscription plans.',
// };

export default function SubscriptionsPage() {
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [pageTitle, setPageTitle] = useState('Juice Subscriptions');

  useEffect(() => {
    // Set document title on client side
    let title = 'Juice Subscriptions - Elixr';
    if (frequencyFilter === 'weekly') {
      title = 'Weekly Subscriptions - Elixr';
    } else if (frequencyFilter === 'monthly') {
      title = 'Monthly Subscriptions - Elixr';
    }
    document.title = title;
    setPageTitle(
      frequencyFilter === 'weekly' ? 'Weekly Subscriptions' :
      frequencyFilter === 'monthly' ? 'Monthly Subscriptions' :
      'All Juice Subscriptions'
    );
  }, [frequencyFilter]);

  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => {
    if (frequencyFilter === 'all') {
      return true;
    }
    return plan.frequency === frequencyFilter;
  });

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <Image src="/images/fruit-bowl-custom.jpg" alt="Subscriptions background" fill className="object-cover opacity-40 blur pointer-events-none select-none" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/80 via-yellow-50/80 to-orange-100/80 mix-blend-multiply" />
      </div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <section className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
              {pageTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
              Never run out of your favorite juices! Choose a plan that fits your lifestyle and get fresh juices delivered regularly.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-headline">
                {frequencyFilter === 'all' ? "Our Plans" : 
                 frequencyFilter === 'weekly' ? "Weekly Plans" : "Monthly Plans"}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter: <span className="capitalize ml-1">{frequencyFilter}</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Frequency</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFrequencyFilter('all')} className={frequencyFilter === 'all' ? 'bg-accent text-accent-foreground' : ''}>
                    All Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFrequencyFilter('weekly')} className={frequencyFilter === 'weekly' ? 'bg-accent text-accent-foreground' : ''}>
                    Weekly Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFrequencyFilter('monthly')} className={frequencyFilter === 'monthly' ? 'bg-accent text-accent-foreground' : ''}>
                    Monthly Plans
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {filteredPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPlans.map((plan, index) => (
                  <div key={plan.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
                    <SubscriptionOptionCard plan={plan} isFeatured={index === 0 && frequencyFilter === 'all'} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No {frequencyFilter !== 'all' ? frequencyFilter : ''} subscription plans found.
              </p>
            )}
          </section>

          <section className="bg-card p-6 md:p-8 rounded-lg shadow-xl">
            <h2 className="text-3xl font-headline text-center mb-6 text-primary">Need Help Choosing?</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Let our AI assistant suggest a personalized subscription plan based on your preferences!
            </p>
            <AISubscriptionRecommender
              tastePreferences={MOCK_USER_TASTE_PREFERENCES}
              consumptionHabits={MOCK_USER_CONSUMPTION_HABITS}
              availableJuiceFlavors={AVAILABLE_JUICE_NAMES_FOR_AI}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

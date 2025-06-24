"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import SubscriptionOptionCard from '@/components/subscriptions/SubscriptionOptionCard';
import AISubscriptionRecommender from '@/components/subscriptions/AISubscriptionRecommender';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter, Gift, Calendar, Zap, Heart, Sparkles, Users, Star } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionsPage() {
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  useEffect(() => {
    const title = frequencyFilter === 'weekly' ? 'Weekly Subscriptions - Elixr' :
                  frequencyFilter === 'monthly' ? 'Monthly Subscriptions - Elixr' :
                  'Juice Subscriptions - Elixr';
    document.title = title;
  }, [frequencyFilter]);

  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => {
    if (frequencyFilter === 'all') return true;
    return plan.frequency === frequencyFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background"></div>
          <Image
            src="/images/fruits.jpg"
            alt="Fresh fruits background"
            fill
            sizes="100vw"
            className="object-cover opacity-20 mix-blend-multiply"
            priority
          />
          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-16 h-16 bg-primary/10 rounded-full animate-float"></div>
          <div className="absolute bottom-32 right-16 w-12 h-12 bg-accent/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="glass-card rounded-3xl p-8 md:p-12 max-w-4xl mx-auto animate-scale-in">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Gift className="w-4 h-4 mr-2" />
                Premium Subscription Plans
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-headline font-bold gradient-text mb-6">
              Our Subscription Plans
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
              At ElixR, we believe in making fresh, nutritious juices a seamless part of your daily routine. 
              Our subscription plans are designed to bring you the best of health with convenience.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="glass border-0 shadow-soft">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Category-Based Plans</h3>
                  <p className="text-sm text-muted-foreground">Expert-curated selections for specific health goals</p>
                </CardContent>
              </Card>
              
              <Card className="glass border-0 shadow-soft">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-8 h-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Customized Plans</h3>
                  <p className="text-sm text-muted-foreground">Mix and match your favorite juices</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Subscribe Section */}
      <section className="py-16 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-headline font-bold gradient-text mb-4">
              Why Choose Our Subscriptions?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the convenience and benefits of regular juice delivery
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card text-center p-6 border-0">
              <CardContent className="pt-6">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Never Run Out</h3>
                <p className="text-muted-foreground">
                  Automatic deliveries ensure you always have fresh juices on hand
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card text-center p-6 border-0">
              <CardContent className="pt-6">
                <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Health Benefits</h3>
                <p className="text-muted-foreground">
                  Consistent nutrition with carefully planned juice combinations
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card text-center p-6 border-0">
              <CardContent className="pt-6">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Save Money</h3>
                <p className="text-muted-foreground">
                  Special subscription pricing with exclusive member discounts
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold gradient-text mb-2">
                {frequencyFilter === 'all' ? "All Subscription Plans" : 
                 frequencyFilter === 'weekly' ? "Weekly Plans" : "Monthly Plans"}
              </h2>
              <p className="text-muted-foreground">
                Choose the perfect plan for your lifestyle and health goals
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="glass border-border/50">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter: <span className="capitalize ml-1">{frequencyFilter}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-0">
                <DropdownMenuItem onClick={() => setFrequencyFilter('all')}>
                  All Plans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFrequencyFilter('weekly')}>
                  Weekly Plans
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFrequencyFilter('monthly')}>
                  Monthly Plans
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPlans.map((plan, index) => (
                <div 
                  key={plan.id} 
                  className="animate-fade-in" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SubscriptionOptionCard plan={plan} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-0 p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Plans Found</h3>
              <p className="text-muted-foreground mb-4">
                No subscription plans match your current filter.
              </p>
              <Button onClick={() => setFrequencyFilter('all')} variant="outline">
                Show All Plans
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* AI Recommendation Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-headline font-bold gradient-text mb-4">
              Personalized Recommendations
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Let our AI help you find the perfect subscription plan based on your preferences
            </p>
          </div>
          <AISubscriptionRecommender />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-headline font-bold mb-6">
              Ready to Start Your Juice Journey?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Join thousands of satisfied customers who have made healthy living a habit with our subscription plans.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 btn-hover-lift">
                <Link href="#plans">
                  Choose Your Plan
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 btn-hover-lift">
                <Link href="/menu">
                  Browse Juices
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

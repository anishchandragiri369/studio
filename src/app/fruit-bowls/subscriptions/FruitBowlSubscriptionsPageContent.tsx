"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Clock, Zap, Heart, Star, Truck, Shield } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import SubscriptionOptionCard from '@/components/subscriptions/SubscriptionOptionCard';

export default function FruitBowlSubscriptionsPageContent() {
  // Filter for fruit bowl only plans
  const fruitBowlPlans = SUBSCRIPTION_PLANS.filter(plan => plan.planType === 'fruit-bowl-only');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-green-50 to-blue-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" asChild className="mb-6">
          <Link href="/fruit-bowls">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fruit Bowls
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary" className="px-4 py-2">
              🥣 Healthy Living
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              Fresh & Nutritious
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-bold gradient-text mb-6">
            Fruit Bowl Subscriptions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Start your day right with nutritious fruit bowls delivered fresh to your doorstep. 
            Choose from our curated selections or customize your own healthy breakfast journey.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="glass-card text-center p-6 border-0">
            <CardContent className="pt-6">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Health First</h3>
              <p className="text-sm text-muted-foreground">
                Packed with vitamins, antioxidants, and natural energy
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card text-center p-6 border-0">
            <CardContent className="pt-6">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Save Time</h3>
              <p className="text-sm text-muted-foreground">
                No shopping, no prep - just grab and enjoy
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card text-center p-6 border-0">
            <CardContent className="pt-6">
              <Truck className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fresh Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Made fresh daily and delivered at peak quality
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card text-center p-6 border-0">
            <CardContent className="pt-6">
              <Star className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Customizable</h3>
              <p className="text-sm text-muted-foreground">
                Choose your favorites or try our curated selections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-headline font-bold gradient-text mb-4">
              Choose Your Fruit Bowl Plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the perfect plan for your healthy lifestyle. All plans include premium fresh fruits and customizable options.
            </p>
          </div>

          {fruitBowlPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {fruitBowlPlans.map((plan) => (
                <SubscriptionOptionCard
                  key={plan.id}
                  plan={plan}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Card className="glass-card max-w-md mx-auto">
                <CardContent className="pt-6">
                  <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Coming Soon!</h3>
                  <p className="text-muted-foreground mb-4">
                    Fruit bowl subscription plans are being prepared. Check back soon!
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/fruit-bowls">Browse Fruit Bowls</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-headline font-bold text-primary mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple steps to start your healthy journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Plan</h3>
              <p className="text-muted-foreground">
                Select weekly or monthly delivery based on your needs
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customize Selection</h3>
              <p className="text-muted-foreground">
                Pick your favorite fruit bowls or let us curate for you
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enjoy Fresh Delivery</h3>
              <p className="text-muted-foreground">
                Receive fresh, nutritious fruit bowls at your doorstep
              </p>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="text-center">
          <div className="glass-card p-8 rounded-xl border border-primary/20">
            <h3 className="text-2xl font-semibold mb-4">Want More Options?</h3>
            <p className="text-muted-foreground mb-6">
              Explore our combo plans that include both fresh juices and fruit bowls for the ultimate healthy lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/subscriptions">View All Subscription Plans</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/fruit-bowls">Browse Individual Fruit Bowls</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

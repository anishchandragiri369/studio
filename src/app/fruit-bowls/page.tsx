"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import FruitBowlCard from '@/components/menu/FruitBowlCard';
import type { FruitBowl } from '@/lib/types';
import { Loader2, Calendar, Heart, Sparkles } from 'lucide-react';

export default function FruitBowlsPage() {
  const [fruitBowls, setFruitBowls] = useState<FruitBowl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFruitBowls = async () => {
      try {
        const response = await fetch('/api/fruit-bowls');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch fruit bowls');
        }

        setFruitBowls(data.fruitBowls);
      } catch (err) {
        console.error('Error fetching fruit bowls:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFruitBowls();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mobile-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading fruit bowls...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mobile-container">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
            Fresh Fruit Bowls
          </h1>
          <p className="text-lg text-destructive max-w-2xl mx-auto">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mobile-container">
      <section className="text-center mb-12 mobile-section">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4 animate-fade-in">
          Fresh Fruit Bowls
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200 mb-6">
          Start your day right or enjoy a healthy snack with our vibrant and nutritious fruit bowls.
        </p>
        
        {/* Subscription CTA */}
        <div className="glass-card p-6 rounded-xl border border-primary/20 max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-semibold">Never Run Out of Healthy Options</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Subscribe to our fruit bowl plans and get fresh, nutritious bowls delivered regularly. Save time and stay healthy!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/fruit-bowls/subscriptions">
                <Calendar className="w-4 h-4 mr-2" />
                View Subscription Plans
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/subscriptions">
                <Sparkles className="w-4 h-4 mr-2" />
                All Subscription Options
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subscription CTA Section */}
      <section className="mb-12">
        <div className="glass-card p-8 rounded-xl border border-primary/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold text-primary">Never Run Out</h2>
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Subscribe to receive fresh fruit bowls delivered regularly. Choose from weekly or monthly plans and customize your selections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/fruit-bowls/subscriptions">
                <Calendar className="w-4 h-4 mr-2" />
                View Fruit Bowl Subscriptions
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/subscriptions">
                All Subscription Plans
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {fruitBowls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {fruitBowls.map((bowl, index) => (
            <div key={bowl.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms`}}>
              <FruitBowlCard fruitBowl={bowl} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground text-lg">No fruit bowls available at the moment. Please check back later!</p>
      )}
    </div>
  );
}

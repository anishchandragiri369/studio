"use client";

import React, { useEffect, useState } from 'react';
import FruitBowlCard from '@/components/menu/FruitBowlCard';
import type { FruitBowl } from '@/lib/types';
import { Loader2 } from 'lucide-react';

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
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-200">
          Start your day right or enjoy a healthy snack with our vibrant and nutritious fruit bowls.
        </p>
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

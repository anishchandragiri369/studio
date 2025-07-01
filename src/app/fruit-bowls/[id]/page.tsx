"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { FruitBowl } from '@/lib/types';
import { ArrowLeft, Clock, Users, Heart, Leaf, Shield, Star, ShoppingCart, Package } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function FruitBowlDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [fruitBowl, setFruitBowl] = useState<FruitBowl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFruitBowl = async () => {
      try {
        const response = await fetch('/api/fruit-bowls');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch fruit bowls');
        }

        const bowl = data.fruitBowls.find((b: FruitBowl) => b.id === params.id);
        if (!bowl) {
          setError('Fruit bowl not found');
        } else {
          setFruitBowl(bowl);
        }
      } catch (err) {
        console.error('Error fetching fruit bowl:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchFruitBowl();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading fruit bowl details...</span>
        </div>
      </div>
    );
  }

  if (error || !fruitBowl) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Fruit Bowl Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The requested fruit bowl could not be found.'}</p>
          <Link href="/fruit-bowls">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fruit Bowls
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getAvailabilityStatus = () => {
    if (fruitBowl.stock_quantity <= 0) return 'Out of Stock';
    if (fruitBowl.stock_quantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link href="/fruit-bowls" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Fruit Bowls
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={fruitBowl.image_url || '/images/fruit-bowl-placeholder.jpg'}
            alt={fruitBowl.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute top-4 right-4">
            <Badge variant={
              availabilityStatus === 'In Stock' ? 'default' : 
              availabilityStatus === 'Low Stock' ? 'secondary' : 
              'destructive'
            }>
              {availabilityStatus}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{fruitBowl.name}</h1>
            <p className="text-xl text-primary font-semibold">₹{fruitBowl.price.toFixed(2)}</p>
            <p className="text-muted-foreground mt-2">{fruitBowl.description}</p>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Prep Time</p>
                <p className="text-sm text-muted-foreground">{fruitBowl.preparation_time} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Serving Size</p>
                <p className="text-sm text-muted-foreground">{fruitBowl.serving_size}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Calories</p>
                <p className="text-sm text-muted-foreground">{fruitBowl.nutritional_info.calories} cal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Stock</p>
                <p className="text-sm text-muted-foreground">{fruitBowl.stock_quantity} available</p>
              </div>
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <h3 className="font-semibold mb-2">Dietary Information</h3>
            <div className="flex flex-wrap gap-2">
              {fruitBowl.dietary_tags.map((tag) => (
                <Badge key={tag} variant="outline" className="capitalize">
                  <Leaf className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Allergen Info */}
          {fruitBowl.allergen_info.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Allergen Information
              </h3>
              <div className="flex flex-wrap gap-2">
                {fruitBowl.allergen_info.map((allergen) => (
                  <Badge key={allergen} variant="destructive" className="capitalize">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/subscribe/fruit-bowls" className="w-full">
              <Button 
                className="w-full" 
                size="lg"
                disabled={availabilityStatus === 'Out of Stock'}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Subscribe to This Bowl
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fruitBowl.ingredients.fruits && (
              <div>
                <h4 className="font-semibold mb-2">Fresh Fruits</h4>
                <div className="space-y-2">
                  {fruitBowl.ingredients.fruits.map((fruit, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        {fruit.name}
                        {fruit.organic && <Badge variant="outline" className="text-xs">Organic</Badge>}
                      </span>
                      <span className="text-sm text-muted-foreground">{fruit.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fruitBowl.ingredients.greens && fruitBowl.ingredients.greens.length > 0 && (
              <div>
                <Separator />
                <h4 className="font-semibold mb-2">Fresh Greens</h4>
                <div className="space-y-2">
                  {fruitBowl.ingredients.greens.map((green, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        {green.name}
                        {green.organic && <Badge variant="outline" className="text-xs">Organic</Badge>}
                      </span>
                      <span className="text-sm text-muted-foreground">{green.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fruitBowl.ingredients.toppings && fruitBowl.ingredients.toppings.length > 0 && (
              <div>
                <Separator />
                <h4 className="font-semibold mb-2">Toppings</h4>
                <div className="space-y-2">
                  {fruitBowl.ingredients.toppings.map((topping, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{topping.name}</span>
                      <span className="text-sm text-muted-foreground">{topping.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nutritional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Nutritional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Calories</p>
                <p className="text-2xl font-bold text-primary">{fruitBowl.nutritional_info.calories}</p>
              </div>
              <div>
                <p className="font-medium">Protein</p>
                <p className="text-lg">{fruitBowl.nutritional_info.protein}</p>
              </div>
              <div>
                <p className="font-medium">Carbohydrates</p>
                <p className="text-lg">{fruitBowl.nutritional_info.carbs}</p>
              </div>
              <div>
                <p className="font-medium">Fiber</p>
                <p className="text-lg">{fruitBowl.nutritional_info.fiber}</p>
              </div>
              <div>
                <p className="font-medium">Sugar</p>
                <p className="text-lg">{fruitBowl.nutritional_info.sugar}</p>
              </div>
              <div>
                <p className="font-medium">Fat</p>
                <p className="text-lg">{fruitBowl.nutritional_info.fat}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Vitamins & Minerals</h4>
              <div className="space-y-2">
                {Object.entries(fruitBowl.nutritional_info.vitamins).map(([vitamin, amount]) => (
                  <div key={vitamin} className="flex justify-between">
                    <span className="capitalize">{vitamin.replace('_', ' ')}</span>
                    <span className="font-medium">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

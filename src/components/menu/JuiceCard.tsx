
"use client";

import Image from 'next/image';
import type { Juice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { PlusCircle, MinusCircle, ShoppingCart, PackageX } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface JuiceCardProps {
  juice: Juice;
}

const JuiceCard = ({ juice }: JuiceCardProps) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (juice.availability === 'Out of Stock') return;
    addToCart(juice, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const isFruitBowl = juice.category === 'Fruit Bowls';
  const isOutOfStock = juice.availability === 'Out of Stock';

  const getAvailabilityClasses = () => {
    switch (juice.availability) {
      case 'In Stock':
        return 'text-green-600 dark:text-green-400';
      case 'Low Stock':
        return 'text-orange-500 dark:text-orange-400';
      case 'Out of Stock':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-green-600 dark:text-green-400'; // Default to In Stock styling
    }
  };
  
  const availabilityText = juice.availability || 'In Stock';

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-card",
        isOutOfStock && "opacity-70"
      )}>
      <CardHeader className="p-0">
        <div 
          className={cn(
            "relative w-full",
            isFruitBowl ? "aspect-[9/16]" : "h-48 md:h-56"
          )}
        >
          <Image
            src={juice.image}
            alt={juice.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
                "transition-transform duration-300 group-hover:scale-105 object-cover",
                isOutOfStock && "grayscale"
            )}
            data-ai-hint={juice.dataAiHint || juice.name.toLowerCase()}
          />
           {isOutOfStock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <PackageX className="h-16 w-16 text-white/70" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-1 text-primary">{juice.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2">{juice.flavor}</CardDescription>
        <p className="text-xs text-foreground/80 mb-3 min-h-[3em] line-clamp-3">{juice.description}</p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold text-accent">Rs.{juice.price.toFixed(2)}</p>
          <p className={cn("text-xs font-medium", getAvailabilityClasses())}>{availabilityText}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Decrease quantity" disabled={isOutOfStock}>
            <MinusCircle className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-medium">{quantity}</span>
          <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Increase quantity" disabled={isOutOfStock}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <Button 
            onClick={handleAddToCart} 
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" 
            disabled={isOutOfStock}
            aria-disabled={isOutOfStock}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JuiceCard;


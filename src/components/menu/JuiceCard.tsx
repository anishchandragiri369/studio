
"use client";

import Image from 'next/image';
import type { Juice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { PlusCircle, MinusCircle, ShoppingCart } from 'lucide-react';
import React, { useState } from 'react';

interface JuiceCardProps {
  juice: Juice;
}

const JuiceCard = ({ juice }: JuiceCardProps) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart(juice, quantity);
    setQuantity(1); // Reset quantity after adding
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-card">
      <CardHeader className="p-0">
        <div className="relative w-full h-48 md:h-56">
          <Image
            src={juice.image}
            alt={juice.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="transition-transform duration-300 group-hover:scale-105 object-cover"
            data-ai-hint={juice.dataAiHint || juice.name.toLowerCase()}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-1 text-primary">{juice.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2">{juice.flavor}</CardDescription>
        <p className="text-xs text-foreground/80 mb-3 min-h-[3em] line-clamp-3">{juice.description}</p>
        <p className="text-lg font-semibold text-accent">Rs.{juice.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Decrease quantity">
            <MinusCircle className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-medium">{quantity}</span>
          <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Increase quantity">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleAddToCart} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JuiceCard;

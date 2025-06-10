
"use client";

import Image from 'next/image';
import type { Juice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext'; // Corrected import path
import { PlusCircle, MinusCircle, ShoppingCart, PackageX, Edit, Save, Minus, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface JuiceCardProps {
  juice: Juice;
}

const JuiceCard = ({ juice }: JuiceCardProps) => {
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const [quantity, setQuantity] = useState(1); // For adding to cart
  const [currentStock, setCurrentStock] = useState<number>(juice.stockQuantity ?? 0);
  const [editedStock, setEditedStock] = useState<number>(juice.stockQuantity ?? 0); // For admin input field
  const [availabilityStatus, setAvailabilityStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');

  useEffect(() => {
    // Initialize currentStock from juice.stockQuantity or default to 0
    const initialStock = juice.stockQuantity ?? 0;
    setCurrentStock(initialStock);
    setEditedStock(initialStock); // Sync editedStock as well
  }, [juice.stockQuantity]);

  useEffect(() => {
    if (currentStock <= 0) {
      setAvailabilityStatus('Out of Stock');
    } else if (currentStock <= 10) {
      setAvailabilityStatus('Low Stock');
    } else {
      setAvailabilityStatus('In Stock');
    }
  }, [currentStock]);

  const handleAddToCart = () => {
    if (availabilityStatus === 'Out of Stock' || currentStock < quantity) {
      // Potentially show a toast message here if trying to add more than available stock
      console.warn("Cannot add to cart: Out of stock or insufficient stock for desired quantity.");
      return;
    }
    addToCart(juice, quantity);
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleStockInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setEditedStock(isNaN(value) ? 0 : Math.max(0, value)); // Ensure stock isn't negative
  };

  const handleStockUpdate = () => {
    // In a real app, this would call a server action/API to update the database
    setCurrentStock(editedStock);
    console.log(`Admin: Juice ${juice.name} (ID: ${juice.id}) stock conceptually updated to ${editedStock}. (This is a visual demo)`);
  };
  
  const handleAdminStockAdjust = (amount: number) => {
    const newStock = Math.max(0, editedStock + amount);
    setEditedStock(newStock);
    // Optionally auto-save on +/- button click or require explicit save
    // For now, let's make it so they still need to click a "Save" or "Update" button if we add one
  };


  const isFruitBowl = juice.category === 'Fruit Bowls';
  const isEffectivelyOutOfStock = availabilityStatus === 'Out of Stock';


  const getAvailabilityClasses = () => {
    switch (availabilityStatus) {
      case 'In Stock':
        return 'text-green-600 dark:text-green-400';
      case 'Low Stock':
        return 'text-orange-500 dark:text-orange-400';
      case 'Out of Stock':
        return 'text-red-500 dark:text-red-400';
      default:
        return 'text-green-600 dark:text-green-400';
    }
  };

  return (
    <Card className={cn(
        "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-card",
        isEffectivelyOutOfStock && !isAdmin && "opacity-70"
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
                isEffectivelyOutOfStock && "grayscale"
            )}
            data-ai-hint={juice.dataAiHint || juice.name.toLowerCase()}
          />
           {isEffectivelyOutOfStock && (
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

        {isAdmin ? (
          <div className="my-3 space-y-2">
            <Label htmlFor={`stock-quantity-${juice.id}`} className="text-xs font-medium">Manage Stock (Qty):</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAdminStockAdjust(-1)}><Minus className="h-4 w-4"/></Button>
              <Input
                id={`stock-quantity-${juice.id}`}
                type="number"
                value={editedStock}
                onChange={handleStockInputChange}
                className="h-8 w-16 text-center px-1"
                min="0"
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAdminStockAdjust(1)}><Plus className="h-4 w-4"/></Button>
              <Button variant="outline" size="sm" onClick={handleStockUpdate} className="h-8">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Set
              </Button>
            </div>
            <p className={cn("text-xs font-medium text-right", getAvailabilityClasses())}>Status: {availabilityStatus} ({currentStock} left)</p>
          </div>
        ) : (
          <div className="flex justify-between items-center mt-2">
            <p className="text-lg font-semibold text-accent">Rs.{juice.price.toFixed(2)}</p>
            <p className={cn("text-xs font-medium", getAvailabilityClasses())}>{availabilityStatus}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isAdmin ? (
            <p className="text-xs text-muted-foreground text-center w-full">Admin stock controls active above.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={decrementQuantity} aria-label="Decrease quantity" disabled={isEffectivelyOutOfStock}>
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Increase quantity" disabled={isEffectivelyOutOfStock}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isEffectivelyOutOfStock || currentStock < quantity}
              aria-disabled={isEffectivelyOutOfStock || currentStock < quantity}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isEffectivelyOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default JuiceCard;

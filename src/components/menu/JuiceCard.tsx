
"use client";

import Image from 'next/image';
import type { Juice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, MinusCircle, ShoppingCart, PackageX, Edit, Save, Minus, Plus, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";

interface JuiceCardProps {
  juice: Juice;
}

const JuiceCard = ({ juice }: JuiceCardProps) => {
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1); // For adding to cart
  const [currentStock, setCurrentStock] = useState<number>(juice.stockQuantity ?? 0);
  const [editedStock, setEditedStock] = useState<number>(juice.stockQuantity ?? 0);
  const [availabilityStatus, setAvailabilityStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  useEffect(() => {
    const initialStock = juice.stockQuantity ?? 0;
    setCurrentStock(initialStock);
    setEditedStock(initialStock);
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
      toast({
        title: "Cannot Add to Cart",
        description: "This item is out of stock or has insufficient quantity.",
        variant: "destructive",
      });
      return;
    }
    addToCart(juice, quantity);
    setQuantity(1); // Reset quantity for next addition
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const handleStockInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setEditedStock(isNaN(value) ? 0 : Math.max(0, value));
  };

  const handleAdminStockAdjust = (amount: number) => {
    setEditedStock(prev => Math.max(0, prev + amount));
  };

  const handleStockUpdate = async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Update Failed",
        description: "Database connection is not configured. Cannot update stock.",
        variant: "destructive",
      });
      return;
    }
    if (editedStock === currentStock) {
      toast({
        title: "No Changes",
        description: "Stock quantity is already set to this value.",
      });
      return;
    }

    setIsUpdatingStock(true);
    try {
      // Assuming 'stock_quantity' is the column name in your Supabase table
      const { error } = await supabase
        .from('juices')
        .update({ stock_quantity: editedStock })
        .eq('id', juice.id);

      if (error) {
        throw error;
      }

      setCurrentStock(editedStock); // Update local state on successful DB update
      toast({
        title: "Stock Updated",
        description: `${juice.name} stock quantity set to ${editedStock}.`,
      });
    } catch (error: any) {
      console.error("Error updating stock in Supabase:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update stock quantity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStock(false);
    }
  };

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
            juice.category === 'Fruit Bowls' ? "aspect-[9/16]" : "h-48 md:h-56" // Adjusted for Fruit Bowls if that category exists
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
             unoptimized={juice.image.startsWith('https://placehold.co')}
             onError={(e) => e.currentTarget.src = 'https://placehold.co/600x400.png'}
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
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAdminStockAdjust(-1)} disabled={isUpdatingStock}><Minus className="h-4 w-4"/></Button>
              <Input
                id={`stock-quantity-${juice.id}`}
                type="number"
                value={editedStock}
                onChange={handleStockInputChange}
                className="h-8 w-16 text-center px-1"
                min="0"
                disabled={isUpdatingStock}
              />
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAdminStockAdjust(1)} disabled={isUpdatingStock}><Plus className="h-4 w-4"/></Button>
              <Button variant="outline" size="sm" onClick={handleStockUpdate} className="h-8" disabled={isUpdatingStock || editedStock === currentStock}>
                {isUpdatingStock ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
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
              <Button variant="outline" size="icon" onClick={incrementQuantity} aria-label="Increase quantity" disabled={isEffectivelyOutOfStock || quantity >= currentStock}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isEffectivelyOutOfStock || quantity > currentStock}
              aria-disabled={isEffectivelyOutOfStock || quantity > currentStock}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isEffectivelyOutOfStock ? 'Out of Stock' : (quantity > currentStock ? 'Not Enough Stock' : 'Add to Cart')}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default JuiceCard;

"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { FruitBowl } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { PlusCircle, MinusCircle, ShoppingCart, PackageX, Clock, Users, Leaf, Heart } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

interface FruitBowlCardProps {
  fruitBowl: FruitBowl;
  onSelect?: (fruitBowl: FruitBowl, quantity: number) => void;
  isSelectionMode?: boolean;
  maxQuantity?: number;
}

const FruitBowlCard = ({ fruitBowl, onSelect, isSelectionMode = false, maxQuantity = 2 }: FruitBowlCardProps) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<'In Stock' | 'Low Stock' | 'Out of Stock'>('In Stock');

  useEffect(() => {
    if (!fruitBowl.stock_quantity || fruitBowl.stock_quantity <= 0) {
      setAvailabilityStatus('Out of Stock');
    } else if (fruitBowl.stock_quantity <= 10) {
      setAvailabilityStatus('Low Stock');
    } else {
      setAvailabilityStatus('In Stock');
    }
  }, [fruitBowl.stock_quantity]);

  const handleQuantityChange = (newQuantity: number) => {
    if (isSelectionMode) {
      // Selection mode logic (for subscription selection)
      if (newQuantity < 0 || newQuantity > maxQuantity || newQuantity > (fruitBowl.stock_quantity || 0)) return;
      setQuantity(newQuantity);
      if (onSelect) {
        onSelect(fruitBowl, newQuantity);
      }
    } else {
      // Regular cart mode logic
      if (newQuantity < 0 || newQuantity > (fruitBowl.stock_quantity || 0)) return;
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (quantity <= 0 || availabilityStatus === 'Out of Stock' || (fruitBowl.stock_quantity || 0) < quantity) {
      toast({
        title: "Cannot Add to Cart",
        description: quantity <= 0 ? "Please select at least 1 item to add to cart." : "This item is out of stock or has insufficient quantity.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert FruitBowl to Juice-like format for cart compatibility
    const cartItem = {
      ...fruitBowl,
      flavor: fruitBowl.ingredients?.fruits?.slice(0, 3).map(f => f.name).join(', ') || 'Mixed Fruits',
      image: fruitBowl.image || fruitBowl.image_url || '/images/fruit-bowl-custom.jpg'
    };
    
    addToCart(cartItem, quantity);
    setQuantity(0);
    toast({
      title: "Added to Cart!",
      description: `${quantity} x ${fruitBowl.name} added.`,
    });
  };

  const incrementQuantity = () => handleQuantityChange(quantity + 1);
  const decrementQuantity = () => handleQuantityChange(quantity - 1);

  // Get main fruits for display
  const mainFruits = fruitBowl.ingredients?.fruits?.slice(0, 3).map(f => f.name).join(', ') || 'Mixed Fruits';

  return (
    <Card className={cn(
      "h-full transition-all duration-300 hover:shadow-lg group relative overflow-hidden",
      availabilityStatus === 'Out of Stock' && "opacity-60",
      isSelectionMode && quantity > 0 && "ring-2 ring-primary"
    )}>
      {/* Stock Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant={
          availabilityStatus === 'In Stock' ? 'default' : 
          availabilityStatus === 'Low Stock' ? 'secondary' : 
          'destructive'
        }>
          {availabilityStatus}
        </Badge>
      </div>

      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={
            (fruitBowl.image && fruitBowl.image.trim()) || 
            (fruitBowl.image_url && fruitBowl.image_url.trim()) || 
            '/images/fruit-bowl-custom.jpg'
          }
          alt={fruitBowl.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {fruitBowl.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {mainFruits}
            </CardDescription>
          </div>
        </div>
        
        {/* Quick Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{fruitBowl.preparation_time || 'N/A'}min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{fruitBowl.serving_size || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{fruitBowl.nutritional_info?.calories} cal</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {fruitBowl.description}
        </p>

        {/* Nutritional Highlights */}
        <div className="flex flex-wrap gap-1 mb-3">
          {fruitBowl.dietary_tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Ingredients Preview */}
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Main ingredients: </span>
          {fruitBowl.ingredients?.fruits?.slice(0, 3).map((fruit, index) => (
            <span key={fruit.name}>
              {fruit.name} ({fruit.quantity})
              {index < Math.min(2, (fruitBowl.ingredients?.fruits?.length || 0) - 1) ? ', ' : ''}
            </span>
          ))}
          {fruitBowl.ingredients?.fruits && fruitBowl.ingredients.fruits.length > 3 && '...'}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <span className="text-lg font-bold text-primary">
            ₹{fruitBowl.price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            Stock: {fruitBowl.stock_quantity || 0}
          </span>
        </div>

        {isSelectionMode ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decrementQuantity}
                disabled={quantity <= 0}
                className="h-8 w-8 p-0"
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
              <span className="min-w-[20px] text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={incrementQuantity}
                disabled={quantity >= maxQuantity || quantity >= (fruitBowl.stock_quantity || 0) || availabilityStatus === 'Out of Stock'}
                className="h-8 w-8 p-0"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              Max {maxQuantity}/day
            </span>
          </div>
        ) : (
          <div className="space-y-2 w-full">
            {/* Add to Cart Controls */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decrementQuantity}
                  disabled={quantity <= 0 || availabilityStatus === 'Out of Stock'}
                  className="h-8 w-8 p-0"
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="min-w-[30px] text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={incrementQuantity}
                  disabled={quantity >= (fruitBowl.stock_quantity || 0) || availabilityStatus === 'Out of Stock'}
                  className="h-8 w-8 p-0"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleAddToCart}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={availabilityStatus === 'Out of Stock' || quantity <= 0}
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add to Cart
              </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              <Link href={`/fruit-bowls/${fruitBowl.id}`} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">
                  View Details
                </Button>
              </Link>
              <Link href={`/fruit-bowls/subscriptions`} className="flex-1">
                <Button 
                  variant="secondary"
                  className="w-full" 
                  size="sm"
                  disabled={availabilityStatus === 'Out of Stock'}
                >
                  Subscribe
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default FruitBowlCard;

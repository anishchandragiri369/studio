"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2, Calendar, Clock, Tag, Settings } from 'lucide-react';
import Link from 'next/link';
import { JUICES as FALLBACK_JUICES } from '@/lib/constants';
import { useEffect, useState } from 'react';

// Import the unified cart item types from CartContext
type RegularCartItem = {
  id: string;
  name: string;
  flavor: string;
  price: number;
  image: string;
  quantity: number;
  type: 'regular';
  dataAiHint?: string;
};

type SubscriptionCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'subscription';
  subscriptionData: {
    planId: string;
    planName: string;
    planFrequency: string;
    subscriptionDuration: number;
    basePrice: number;
    selectedJuices: { juiceId: string; quantity: number }[];
    selectedFruitBowls?: { fruitBowlId: string; quantity: number }[];
    selectedCategory?: string | null;
    categoryDistribution?: any[] | null;
  };
  image?: string;
};

export type UnifiedCartItem = RegularCartItem | SubscriptionCartItem;

interface CartItemProps {
  item: UnifiedCartItem;
}

const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [fruitBowls, setFruitBowls] = useState<any[]>([]);
  const [juices, setJuices] = useState<any[]>([]);

  // Fetch juices and fruit bowls for name resolution
  useEffect(() => {
    const fetchData = async () => {
      // Fetch juices if subscription has selected juices
      if (item.type === 'subscription' && item.subscriptionData.selectedJuices && item.subscriptionData.selectedJuices.length > 0) {
        try {
          const juiceResponse = await fetch('/api/juices');
          if (juiceResponse.ok) {
            const juiceData = await juiceResponse.json();
            const fetchedJuices = juiceData.juices || [];
            console.log('Fetched juices for cart:', fetchedJuices.length, 'juices');
            setJuices(fetchedJuices);
          } else {
            console.error('Failed to fetch juices:', juiceResponse.status, juiceResponse.statusText);
            setJuices([]);
          }
        } catch (error) {
          console.error('Failed to fetch juices:', error);
          setJuices([]);
        }
      }

      // Fetch fruit bowls if subscription has selected fruit bowls
      if (item.type === 'subscription' && item.subscriptionData.selectedFruitBowls && item.subscriptionData.selectedFruitBowls.length > 0) {
        try {
          const fruitBowlResponse = await fetch('/api/fruit-bowls');
          if (fruitBowlResponse.ok) {
            const fruitBowlData = await fruitBowlResponse.json();
            setFruitBowls(fruitBowlData.fruitBowls || []);
          } else {
            console.error('Failed to fetch fruit bowls:', fruitBowlResponse.status, fruitBowlResponse.statusText);
            setFruitBowls([]);
          }
        } catch (error) {
          console.error('Failed to fetch fruit bowls:', error);
          setFruitBowls([]);
        }
      }
    };

    fetchData();
  }, [item]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  // Handle subscription items differently - they can't change quantity
  const isSubscription = item.type === 'subscription';
  const canChangeQuantity = !isSubscription;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors rounded-md">
      {/* Item Image and Details */}
      <div className="flex-shrink-0 self-center sm:self-auto">
        {item.type === 'regular' ? (
          <Link href={`/menu#${item.id}`} aria-label={`View ${item.name} details`} className="flex items-center gap-2">
            <Image
              src={item.image}
              alt={item.name}
              width={80}
              height={80}
              className="rounded-md object-contain border"
              data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
              role="img"
            />
            <h3 className="font-headline text-lg text-primary hover:text-primary/80 transition-colors">{item.name}</h3>
          </Link>
        ) : (
          <div className="w-20 h-20 rounded-md border bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        )}
      </div>

      <div className="flex-grow w-full sm:w-auto">
        {/* Item Flavor and Price */}
        {item.type === 'regular' && (
          <>
            <p className="text-sm text-muted-foreground">{item.flavor}</p>
            <p className="text-sm font-semibold text-accent">Rs.{item.price.toFixed(2)} each</p>
          </>
        )}

        {/* Subscription Details */}
        {item.type === 'subscription' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground capitalize">{item.subscriptionData.planFrequency} delivery</p>
            </div>
            
            {/* Show category or customization info */}
            {item.subscriptionData.selectedCategory && item.subscriptionData.selectedCategory !== 'customized' ? (
              <div className="text-sm">
                <div className="flex items-center gap-1 mb-1">
                  <Tag className="h-3 w-3 text-green-600" />
                  <p className="font-medium text-green-700">Category: {item.subscriptionData.selectedCategory}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Juices will be distributed from this category across your subscription period
                </p>
                {/* Show category distribution if available */}
                {item.subscriptionData.categoryDistribution && item.subscriptionData.categoryDistribution.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-1">Distribution Preview:</p>
                    <div className="text-xs text-green-600">
                      {item.subscriptionData.categoryDistribution.slice(0, 3).map((dist: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>Day {dist.day}:</span>
                          <span>{dist.juiceName}</span>
                        </div>
                      ))}
                      {item.subscriptionData.categoryDistribution.length > 3 && (
                        <p className="text-xs text-green-600 mt-1">... and {item.subscriptionData.categoryDistribution.length - 3} more days</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : item.subscriptionData.selectedJuices && item.subscriptionData.selectedJuices.length > 0 ? (
              <div className="text-sm">
                <div className="flex items-center gap-1 mb-1">
                  <Settings className="h-3 w-3 text-purple-600" />
                  <p className="font-medium text-purple-700">Customized Selection</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.subscriptionData.selectedJuices.length} juice{item.subscriptionData.selectedJuices.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-muted-foreground">Standard plan configuration</p>
              </div>
            )}
            
            {/* Selected Juices */}
            {item.subscriptionData.selectedJuices && item.subscriptionData.selectedJuices.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Juices:</p>
                <div className="space-y-1">
                  {item.subscriptionData.selectedJuices.map(sj => {
                    // Try to find juice in fetched juices first (database IDs)
                    let juiceInfo = juices.find((j: any) => j.id === sj.juiceId);
                    
                    // If not found, try to find by string comparison (for database IDs)
                    if (!juiceInfo) {
                      juiceInfo = juices.find((j: any) => j.id.toString() === sj.juiceId.toString());
                    }
                    
                    // If still not found, try fallback constants (for legacy IDs)
                    if (!juiceInfo) {
                      juiceInfo = FALLBACK_JUICES.find((j: any) => j.id === sj.juiceId);
                    }
                    
                    // If still not found, try string comparison with fallback
                    if (!juiceInfo) {
                      juiceInfo = FALLBACK_JUICES.find((j: any) => j.id.toString() === sj.juiceId.toString());
                    }
                    
                    // Debug logging
                    if (!juiceInfo) {
                      console.log('Could not find juice for ID:', sj.juiceId, 'Available juices:', juices.map(j => j.id), 'Fallback juices:', FALLBACK_JUICES.map(j => j.id));
                    }
                    
                    return (
                      <p key={sj.juiceId} className="text-muted-foreground">
                        {sj.quantity}x {juiceInfo ? juiceInfo.name : `Juice (ID: ${sj.juiceId})`}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Fruit Bowls */}
            {item.subscriptionData.selectedFruitBowls && item.subscriptionData.selectedFruitBowls.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Fruit Bowls:</p>
                <div className="space-y-1">
                  {item.subscriptionData.selectedFruitBowls.map(sfb => {
                    const fruitBowlInfo = fruitBowls.find(fb => fb.id === sfb.fruitBowlId);
                    return (
                      <p key={sfb.fruitBowlId} className="text-muted-foreground">
                        {sfb.quantity}x {fruitBowlInfo ? fruitBowlInfo.name : `Fruit Bowl (ID: ${sfb.fruitBowlId})`}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-sm font-semibold text-accent">Rs.{item.price.toFixed(2)} per {item.subscriptionData.planFrequency}</p>
          </div>
        )}
      </div>

      {/* Actions and Item Subtotal Section */}
      <div className="flex flex-col items-stretch gap-3 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3 mt-2 sm:mt-0">
        {canChangeQuantity ? (
          <div className="flex items-center gap-1 justify-center sm:justify-start">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    handleQuantityChange(Math.max(1, val));
                  }
              }}
              onBlur={(e) => {
                if (item.quantity < 1) handleQuantityChange(1);
              }}
              className="w-12 h-8 sm:h-9 text-center focus-visible:ring-primary px-1"
              min="1"
              aria-label={`${item.name} quantity`}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center px-4 py-2 bg-muted/30 rounded-md">
            <span className="text-sm text-muted-foreground">Subscription Plan</span>
          </div>
        )}

        <p className="text-md font-semibold text-accent text-right sm:text-center sm:min-w-[70px] md:min-w-[90px]">
          Rs.{(item.price * item.quantity).toFixed(2)}
        </p>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeFromCart(item.id)}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 self-center sm:self-auto"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {item.type === 'subscription' && item.subscriptionData?.planId && (
        <Link href={`/subscriptions/subscribe?plan=${item.subscriptionData.planId}`} className="inline-block mt-2 text-xs text-blue-600 hover:underline font-semibold">
          Edit Plan
        </Link>
      )}
    </div>
  );
};

export default CartItem;

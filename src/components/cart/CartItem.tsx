"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

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
  };
  image?: string;
};

export type UnifiedCartItem = RegularCartItem | SubscriptionCartItem;

interface CartItemProps {
  item: UnifiedCartItem;
}

const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeFromCart } = useCart();

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
              suppressHydrationWarning
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
              suppressHydrationWarning
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
              suppressHydrationWarning
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
          suppressHydrationWarning
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default CartItem;


"use client";

import Image from 'next/image';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface CartItemProps {
  item: CartItemType;
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors rounded-md">
      <Link href={`/menu#${item.id}`} className="flex-shrink-0 self-center sm:self-auto" aria-label={`View ${item.name} details`}>
        <Image
          src={item.image}
          alt={item.name}
          width={80}
          height={80}
          className="rounded-md object-cover border"
          data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
        />
      </Link>

      <div className="flex-grow w-full sm:w-auto"> {/* Item details */}
        <Link href={`/menu#${item.id}`}>
          <h3 className="font-headline text-lg text-primary hover:text-primary/80 transition-colors">{item.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{item.flavor}</p>
        <p className="text-sm font-semibold text-accent">Rs.{item.price.toFixed(2)} each</p>
      </div>

      {/* Actions and Item Subtotal Section */}
      <div className="flex flex-col items-stretch gap-3 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3 mt-2 sm:mt-0">
        <div className="flex items-center gap-1 justify-center sm:justify-start"> {/* Quantity controls */}
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
                  handleQuantityChange(Math.max(1, val)); // Ensure quantity doesn't go below 1 from direct input
                }
            }}
            onBlur={(e) => { // Handle case where input is empty or invalid on blur
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

        <p className="text-md font-semibold text-accent text-right sm:text-center sm:min-w-[70px] md:min-w-[90px]"> {/* Item subtotal */}
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
    </div>
  );
};

export default CartItem;

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
    <div className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors rounded-md">
      <Link href={`/menu#${item.id}`} className="flex-shrink-0"> {/* Assuming you can link to specific item on menu */}
        <Image
          src={item.image}
          alt={item.name}
          width={80}
          height={80}
          className="rounded-md object-cover border"
          data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
        />
      </Link>
      <div className="flex-grow">
        <Link href={`/menu#${item.id}`}>
          <h3 className="font-headline text-lg text-primary transition-colors">{item.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{item.flavor}</p>
        <p className="text-sm font-semibold text-accent">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
            className="w-16 h-9 text-center focus-visible:ring-primary"
            min="1"
            aria-label={`${item.name} quantity`}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-md font-semibold w-20 text-right hidden sm:block text-accent">
          ${(item.price * item.quantity).toFixed(2)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeFromCart(item.id)}
          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
       <p className="text-md font-semibold w-full text-right sm:hidden mt-2 text-accent">
          Subtotal: ${(item.price * item.quantity).toFixed(2)}
        </p>
    </div>
  );
};

export default CartItem;

"use client"; // This page uses hooks, so it must be a client component

import CartItemComponent from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
// import { Metadata } from 'next'; // Metadata cannot be used in client components directly

// For page title and meta in client components, you might need to use a different approach
// or set it in a parent server component if layout allows.
// For simplicity, we'll skip dynamic metadata here. Consider using a useEffect to set document.title if needed.

export default function CartPage() {
  const { cartItems } = useCart();

  if (typeof window !== 'undefined') { // For client-side only title update
    document.title = 'Your Cart - JuiceBox';
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">Your Shopping Cart</h1>
        {cartItems.length > 0 ? (
          <p className="text-lg text-muted-foreground">Review your items and proceed to checkout.</p>
        ) : null}
      </section>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty!</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven&apos;t added any juices yet.</p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/menu">Explore Our Juices</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-headline mb-6">Items in Cart ({cartItems.length})</h2>
            <div className="space-y-4">
              {cartItems.map(item => (
                <CartItemComponent key={item.id} item={item} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  );
}

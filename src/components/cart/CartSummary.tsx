
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const CartSummary = () => {
  const { getCartTotal, clearCart, cartItems } = useCart();
  const total = getCartTotal();
  const shippingCost = total > 0 ? 5.00 : 0; // Example shipping
  const grandTotal = total + shippingCost;

  if (cartItems.length === 0) {
    return null; // Don't show summary if cart is empty
  }

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <p className="text-muted-foreground">Subtotal</p>
          <p className="font-medium text-accent">Rs.{total.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-muted-foreground">Estimated Shipping</p>
          <p className="font-medium text-accent">Rs.{shippingCost.toFixed(2)}</p>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-semibold">
          <p>Grand Total</p>
          <p className="text-primary">Rs.{grandTotal.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
        <Button variant="outline" onClick={clearCart} className="w-full">
          Clear Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CartSummary;

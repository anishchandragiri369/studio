
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const CartSummary = () => {
  const { getCartTotal, clearCart, cartItems } = useCart();
  const total = getCartTotal();
  
  // Free delivery above ₹299, otherwise ₹50 delivery charge
  const DELIVERY_CHARGE = 50;
  const FREE_DELIVERY_THRESHOLD = 299;
  const shippingCost = total > 0 ? (total >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE) : 0;
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
          <p className="font-medium text-accent">₹{total.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-muted-foreground">Delivery Charges</p>
          <p className="font-medium text-accent">
            {shippingCost === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `₹${shippingCost.toFixed(2)}`
            )}
          </p>
        </div>
        {total > 0 && total < FREE_DELIVERY_THRESHOLD && (
          <div className="text-xs text-muted-foreground px-1">
            <span className="text-orange-600">
              Add ₹{(FREE_DELIVERY_THRESHOLD - total).toFixed(0)} more for free delivery!
            </span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-lg font-semibold">
          <p>Grand Total</p>
          <p className="text-primary">₹{grandTotal.toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
        <Button variant="outline" onClick={() => clearCart(true)} className="w-full">
          Clear Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CartSummary;


"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
// import type { Metadata } from 'next'; // Keep for potential future use or if parts are server-rendered

// Client components cannot directly export metadata.
// If dynamic metadata is needed, it should be handled in a parent layout or via useEffect for document.title.
// export const metadata: Metadata = {
// title: 'Checkout - Elixr',
//   description: 'Complete your Elixr order.',
// };

export default function CheckoutPage() {
  const { toast } = useToast();

  const handlePlaceOrder = () => {
    // In a real application, this would trigger payment processing and order submission.
    toast({
      title: "Order Placed (Conceptual)",
      description: "Thank you for your order! This is a conceptual confirmation.",
    });
    // Potentially redirect to an order confirmation page or clear cart after a delay.
    // For now, just a toast.
  };
  
  if (typeof window !== 'undefined') {
    document.title = 'Checkout - Elixr';
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/cart">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Link>
      </Button>

      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
          Checkout
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          You&apos;re almost there! Please review your order and complete your purchase.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Order Details & Payment</CardTitle>
              <CardDescription>Shipping information and payment method will be collected here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Placeholder for shipping form */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Shipping Information</h3>
                <p className="text-sm text-muted-foreground">Address form would go here.</p>
              </div>

              {/* Placeholder for payment form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-1">Credit/Debit Card</h4>
                    <p className="text-sm text-muted-foreground">Secure card payment form would be here (e.g., Stripe Elements).</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-semibold mb-1">PayPal</h4>
                    <p className="text-sm text-muted-foreground">PayPal button and integration would appear here.</p>
                    {/* Example of where a PayPal button might go - this is non-functional */}
                    <Button variant="outline" className="mt-2 w-full" disabled>
                      Pay with PayPal (Placeholder)
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 mt-6"
                onClick={handlePlaceOrder}
              >
                <CreditCard className="mr-2 h-5 w-5" /> Confirm & Pay (Concept)
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="shadow-lg sticky top-24">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Your Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* This would dynamically list items from the cart */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Juice A x 2</span>
                <span className="font-semibold text-accent">$11.98</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Juice B x 1</span>
                <span className="font-semibold text-accent">$6.49</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                <span>Subtotal</span>
                <span className="text-accent">$18.47</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold text-accent">$5.00</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold text-primary">
                <span>Total</span>
                <span>$23.47</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

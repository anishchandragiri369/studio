"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export default function OrderSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    // Set page title
    document.title = 'Order Successful - Elixr';
    
    // Clear the cart after successful order completion
    clearCart(false); // Clear cart without showing toast since we're on success page
  }, [clearCart]);

  return (
    <div className="container mx-auto px-4 py-12 mobile-container">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary">
              Order Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase! Your order has been confirmed and is being processed.
            </p>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We&apos;ll send you an email confirmation with your order details and tracking information once your order ships.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Return Home
                  </Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/orders">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    View Orders
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, ArrowLeft, MapPin, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutAddressSchema } from '@/lib/zod-schemas';
import type { CheckoutAddressFormData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CheckoutPage() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      country: 'India', // Default country
    }
  });

  const handleFormSubmit: SubmitHandler<CheckoutAddressFormData> = (data) => {
    console.log("Checkout Form Data:", data);
    // In a real application, this would trigger payment processing and order submission.
    toast({
      title: "Order Placed (Conceptual)",
      description: "Thank you for your order! Address details logged. This is a conceptual confirmation.",
    });
    // Potentially redirect to an order confirmation page or clear cart after a delay.
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
          You&apos;re almost there! Please provide your shipping details and complete your purchase.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Shipping & Payment</CardTitle>
              <CardDescription>Please enter your shipping address and payment details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Shipping Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" {...register("firstName")} placeholder="John" />
                        {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" {...register("email")} placeholder="you@example.com" />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input id="mobileNumber" type="tel" {...register("mobileNumber")} placeholder="+91 98765 43210" />
                    </div>
                    
                    {/* Placeholder for Google Maps Search - Actual implementation is complex */}
                    <div className="space-y-1">
                       <Label htmlFor="googleMapsSearch">Search Address (e.g., Google Maps)</Label>
                       <Input id="googleMapsSearch" placeholder="Start typing your address..." />
                       <Alert variant="default" className="mt-2 p-3 text-xs bg-muted/30 border-primary/30">
                          <MapPin className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
                          <AlertDescription>
                           Live address search (like Google Maps Autocomplete) would populate fields below. This requires API setup. For now, please fill manually.
                          </AlertDescription>
                       </Alert>
                    </div>


                    <div>
                      <Label htmlFor="addressLine1">Address Line 1 *</Label>
                      <Input id="addressLine1" {...register("addressLine1")} placeholder="123 Juice Street" />
                      {errors.addressLine1 && <p className="text-sm text-destructive mt-1">{errors.addressLine1.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="addressLine2">Address Line 2 (Apartment, Suite, etc.)</Label>
                      <Input id="addressLine2" {...register("addressLine2")} placeholder="Apt 4B" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" {...register("city")} placeholder="Flavor Town" />
                        {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="state">State / Province *</Label>
                        <Input id="state" {...register("state")} placeholder="California" />
                        {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP / Postal Code *</Label>
                        <Input id="zipCode" {...register("zipCode")} placeholder="90210" />
                        {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Input id="country" {...register("country")} />
                        {errors.country && <p className="text-sm text-destructive mt-1">{errors.country.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method Section (Placeholder) */}
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
                      <Button variant="outline" className="mt-2 w-full" disabled>
                        Pay with PayPal (Placeholder)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 mt-6"
                >
                  <CreditCard className="mr-2 h-5 w-5" /> Confirm & Pay (Concept)
                </Button>
              </form>
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
                <span className="font-semibold text-accent">Rs.11.98</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Juice B x 1</span>
                <span className="font-semibold text-accent">Rs.6.49</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                <span>Subtotal</span>
                <span className="text-accent">Rs.18.47</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-semibold text-accent">Rs.5.00</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold text-primary">
                <span>Total</span>
                <span>Rs.23.47</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, ArrowLeft, MapPin, Info, AlertTriangle, Wallet, Loader2 } from 'lucide-react'; // Added Wallet & Loader2
import { useToast } from "@/hooks/use-toast";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutAddressSchema } from '@/lib/zod-schemas';
import type { CheckoutAddressFormData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddressAutocomplete from '@/components/checkout/AddressAutocomplete';
import { useState } from 'react'; // Added useState

export default function CheckoutPage() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      country: 'India', // Default country
    }
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // State for payment processing

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleFormSubmit: SubmitHandler<CheckoutAddressFormData> = (data) => {
    console.log("Checkout Form Data:", data);
    toast({
      title: "Order Placed (Conceptual)",
      description: "Thank you for your order! Address details logged. This is a conceptual confirmation for standard checkout.",
    });
  };

  const handlePlaceSelected = (placeDetails: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    setValue('addressLine1', placeDetails.addressLine1, { shouldValidate: true });
    setValue('city', placeDetails.city, { shouldValidate: true });
    setValue('state', placeDetails.state, { shouldValidate: true });
    setValue('zipCode', placeDetails.zipCode, { shouldValidate: true });
    setValue('country', placeDetails.country || 'India', { shouldValidate: true });
  };
  
  const handleCashfreePayment = async () => {
    setIsProcessingPayment(true);
    toast({
      title: "Processing Cashfree Payment...",
      description: "Attempting to create a conceptual order with our backend.",
    });

    try {
      // 1. Call your backend API to create a Cashfree order
      const response = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ /* order details like amount, items from cart/state */ }), // Send actual order details
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Conceptual Cashfree backend response:", result);
        toast({
          title: "Cashfree Order Created (Conceptual)",
          description: `Received orderToken: ${result.data?.orderToken}. Next, use Cashfree JS SDK.`,
        });
        // 2. In a real app, use result.data.orderToken with Cashfree's JS SDK
        //    to initiate the payment on the frontend.
        //    Example (conceptual):
        //    const cfCheckout = new CashfreeCheckout(result.data.orderToken);
        //    cfCheckout.doPayment(); // This would open Cashfree's payment page/modal
        alert(`Conceptual: Received orderToken: ${result.data?.orderToken}. Would now invoke Cashfree SDK.`);
      } else {
        toast({
          title: "Cashfree Order Failed (Conceptual)",
          description: result.message || "Could not create order with backend.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error calling /api/cashfree/create-order:", error);
      toast({
        title: "Cashfree Payment Error (Conceptual)",
        description: "Failed to connect to backend for Cashfree order.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
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
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline text-xl">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <AddressAutocomplete 
                      apiKey={googleMapsApiKey} 
                      onPlaceSelected={handlePlaceSelected} 
                    />
                     {!googleMapsApiKey && (
                        <Alert variant="default" className="mt-2 p-3 text-xs bg-muted/30 border-primary/30">
                          <AlertTriangle className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
                           <AlertTitle className="text-sm font-semibold">Address Autocomplete Not Configured</AlertTitle>
                          <AlertDescription>
                           To enable Google Maps address search, set the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your .env file and restart the server.
                           You can still enter your address manually below.
                          </AlertDescription>
                       </Alert>
                     )}

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
                      <Button type="button" variant="outline" className="mt-2 w-full" disabled>
                        Pay with PayPal (Placeholder)
                      </Button>
                    </div>
                     <div className="p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-semibold mb-1">Cashfree</h4>
                      <p className="text-sm text-muted-foreground">Securely pay using Cashfree Payment Gateway.</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-2 w-full border-primary text-primary hover:bg-primary/10"
                        onClick={handleCashfreePayment}
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wallet className="mr-2 h-4 w-4" />
                        )}
                         Pay with Cashfree (Conceptual)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-3 mt-6"
                >
                  <CreditCard className="mr-2 h-5 w-5" /> Confirm Details & Proceed (Concept)
                </Button>
                 <Alert variant="default" className="mt-4 p-3 text-xs bg-muted/30 border-primary/30">
                    <Info className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
                    <AlertDescription>
                    This is a conceptual checkout. Clicking 'Confirm Details' will log your address. Payment method selection is for demonstration.
                    Cashfree payment is a conceptual frontend to backend call.
                    </AlertDescription>
                </Alert>
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
              {/* This should be dynamically populated from the cart */}
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

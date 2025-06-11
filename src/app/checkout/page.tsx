"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, ArrowLeft, MapPin, Info, AlertTriangle, Wallet, Loader2, ShoppingBag } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutAddressSchema } from '@/lib/zod-schemas';
import type { CheckoutAddressFormData, Juice as JuiceType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddressAutocomplete from '@/components/checkout/AddressAutocomplete';
import { useCart } from '@/hooks/useCart';
import { JUICES } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

interface SubscriptionOrderItem {
  id: string;
  name: string;
  quantity: number;
  image?: string;
  dataAiHint?: string;
}

// Add Cashfree SDK types
declare global {
  interface Window {
    cashfree: {
      checkout: (options: {
        paymentSessionId: string;
        onSuccess?: (data: any) => void;
        onFailure?: (data: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

function CheckoutPageContents() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cartItems, getCartTotal, clearCart } = useCart();

  const [isSubscriptionCheckout, setIsSubscriptionCheckout] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    planId: string;
    planName: string;
    planPrice: number;
    planFrequency: string;
  } | null>(null); // Explicitly initialize as null
  const [subscriptionOrderItems, setSubscriptionOrderItems] = useState<SubscriptionOrderItem[]>([]);
  const [currentOrderTotal, setCurrentOrderTotal] = useState(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      country: 'India',
    }
  });

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    setIsLoadingSummary(true);
    const planId = searchParams.get('planId') as string | null;
    const planName = searchParams.get('planName') as string | null;
    const planPriceStr = searchParams.get('planPrice') as string | null;
    const planFrequency = searchParams.get('planFrequency') as string | null;
    const selectedJuicesStr = searchParams.get('selectedJuices');

    if (planId && planName && planPriceStr && planFrequency) {
      setIsSubscriptionCheckout(true);
      const planPrice = parseFloat(planPriceStr);
      setSubscriptionDetails({ planId, planName, planPrice, planFrequency });
      setCurrentOrderTotal(planPrice); // Shipping is 0 for subscriptions

      if (selectedJuicesStr) {
        try {
          const parsedSelections: Record<string, number> = JSON.parse(selectedJuicesStr);
          const items: SubscriptionOrderItem[] = Object.entries(parsedSelections)
            .map(([juiceId, quantity]) => {
              const juiceInfo = JUICES.find(j => j.id === juiceId);
              return juiceInfo ? { id: juiceInfo.id, name: juiceInfo.name, quantity, image: juiceInfo.image, dataAiHint: juiceInfo.dataAiHint } : null;
            })
            .filter(item => item !== null) as SubscriptionOrderItem[];
          setSubscriptionOrderItems(items);
        } catch (e) {
          console.error("Error parsing selectedJuices from query params:", e);
          setSubscriptionOrderItems([]);
           toast({ title: "Error", description: "Could not load custom juice selections for subscription.", variant: "destructive" });
        }
      } else {
        // Handle case where plan is not customizable or no juices were selected (e.g. uses default plan juices)
        // For this demo, if selectedJuicesStr is not there for a customizable plan, it will show no items.
        // A more robust solution would fetch default plan items if !isCustomizable or selectedJuicesStr is empty.
        setSubscriptionOrderItems([]);
      }
    } else {
      setIsSubscriptionCheckout(false);
      const cartTotal = getCartTotal();
      const shippingCost = cartTotal > 0 ? 5.00 : 0;
      setCurrentOrderTotal(cartTotal + shippingCost);
      setSubscriptionDetails(null);
      setSubscriptionOrderItems([]);
    }
    setIsLoadingSummary(false);
  }, [searchParams, getCartTotal, toast]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Checkout - Elixr';
    }
  }, []);

  const handleFormSubmit: SubmitHandler<CheckoutAddressFormData> = (data) => {
    console.log("Checkout Form Data (Address):", data);
    console.log("Order Total for conceptual processing:", currentOrderTotal.toFixed(2));
    toast({
      title: "Order Details Logged (Conceptual)",
      description: `Address details submitted. Total amount: Rs.${currentOrderTotal.toFixed(2)}. This is a conceptual confirmation.`,
    });
    // Potentially redirect or clear cart/subscription state here
  };

  useEffect(() => {
    if (!isSubscriptionCheckout && cartItems.length === 0 && !isLoadingSummary) {
      // Only show toast if not subscription checkout AND cart is empty
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "default"
      });
    }
  }, [cartItems, isSubscriptionCheckout, isLoadingSummary, toast]);
  
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

  // Add function to load Cashfree SDK
  const loadCashfreeSDK = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.cashfree) {
        setIsSdkLoaded(true);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => {
        // Wait a bit to ensure SDK is fully initialized
        console.log('Cashfree SDK script loaded. Waiting for initialization...');
        setTimeout(() => { // Increased timeout for initialization check
          if (window.cashfree) {
            console.log('Cashfree SDK initialized.');
            setIsSdkLoaded(true);
            resolve();
          } else {
            reject(new Error('Cashfree SDK script loaded but window.cashfree object not found.'));
          }
        }, 1000);
      };
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };
      document.body.appendChild(script);
    });
  };

  // Modify handleCashfreePayment function
  const handleCashfreePayment = async () => {
    setIsProcessingPayment(true);
    toast({
      title: "Processing Payment...",
      description: "Initializing payment gateway...",
    });

    try {
      // Load SDK if not already loaded
      if (!isSdkLoaded || !window.cashfree) {
        await loadCashfreeSDK();
      }

      // Verify SDK is loaded
      if (!window.cashfree) {
        throw new Error('Cashfree SDK failed to initialize');
      }

      // Get form data using a promise-based approach
      let formData: CheckoutAddressFormData | null = null;
      await new Promise<void>((resolve) => {
        handleSubmit(
          (data) => {
            formData = data;
            resolve();
          },
          () => {
            resolve();
          }
        )();
      });

      if (!formData) {
        throw new Error("Please fill in all required shipping details");
      }

      // Create order
      const response = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderAmount: currentOrderTotal,
          orderItems: isSubscriptionCheckout ? subscriptionOrderItems : cartItems,
          customerInfo: {
            name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
            email: formData.email,
            phone: formData.mobileNumber,
            address: {
              line1: formData.addressLine1,
              line2: formData.addressLine2,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country,
            }
          }
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Double check SDK is available before proceeding
        if (!window.cashfree) {
          throw new Error('Cashfree SDK not available');
        }

        // Initialize Cashfree checkout
        window.cashfree.checkout({
          paymentSessionId: result.data.orderToken,
          onSuccess: async (data) => {
            console.log("Payment successful:", data);
            toast({
              title: "Payment Successful!",
              description: "Your order has been placed successfully.",
            });

            // Call webhook to confirm payment and update stock
            try {
              const webhookResponse = await fetch('/api/webhook/payment-confirm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: result.data.orderId,
                  paymentId: data.paymentId,
                  status: 'success',
                  items: isSubscriptionCheckout ? subscriptionOrderItems : cartItems,
                  customerInfo: {
                    name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
                    email: formData.email,
                    phone: formData.mobileNumber,
                    address: {
                      line1: formData.addressLine1,
                      line2: formData.addressLine2,
                      city: formData.city,
                      state: formData.state,
                      zipCode: formData.zipCode,
                      country: formData.country,
                    }
                  }
                }),
              });

              if (webhookResponse.ok) {
                // Clear cart if not subscription checkout
                if (!isSubscriptionCheckout) {
                  clearCart();
                }
                // Redirect to success page
                router.push('/order-success');
              }
            } catch (error) {
              console.error("Error confirming payment:", error);
              toast({
                title: "Order Placed",
                description: "Your payment was successful, but there was an error updating the order status. Please contact support.",
                variant: "destructive",
              });
            }
          },
          onFailure: (data) => {
            console.error("Payment failed:", data);
            toast({
              title: "Payment Failed",
              description: "There was an error processing your payment. Please try again.",
              variant: "destructive",
            });
          },
          onClose: () => {
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window. You can try again when you're ready.",
            });
          },
        });
      } else {
        throw new Error(result.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const isCheckoutDisabled = isLoadingSummary || (isSubscriptionCheckout ? !subscriptionDetails : cartItems.length === 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="outline" asChild className="mb-8">
        <Link href={isSubscriptionCheckout ? `/subscriptions/subscribe?plan=${subscriptionDetails?.planId}` : "/cart"}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {isSubscriptionCheckout ? "Subscription Details" : "Cart"}
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

      {isLoadingSummary ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
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
                    <CardContent className="space-y-4 pb-0">
                       {isCheckoutDisabled && (
                           <Alert variant="default" className="text-center">
                               <ShoppingBag className="mx-auto h-6 w-6 mb-2 text-muted-foreground" />
                               <AlertTitle>No items to checkout</AlertTitle>
                               <AlertDescription>
                                   {isSubscriptionCheckout ? "Subscription details are missing." : "Your cart is empty."} Please add items or select a subscription to proceed.
                                   {isSubscriptionCheckout && !subscriptionDetails && " You might need to go back and select a plan."}
                               </AlertDescription>
                                {!isSubscriptionCheckout && (
                                    <Button asChild variant="link" className="mt-2 text-primary">
                                        <Link href="/menu">Browse Juices</Link>
 
                                    </Button>
                                )}
                           </Alert>
                       )}
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-semibold mb-1">Credit/Debit Card</h4>
                        <p className="text-sm text-muted-foreground">Secure card payment form would be here (e.g., Stripe Elements).</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-semibold mb-1">Cashfree</h4>
                        <p className="text-sm text-muted-foreground">Securely pay using Cashfree Payment Gateway.</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-2 w-full border-primary text-primary hover:bg-primary/10"
                          onClick={handleCashfreePayment}
                          disabled={isProcessingPayment || isCheckoutDisabled}
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
                    disabled={isCheckoutDisabled}
                  >
                    <CreditCard className="mr-2 h-5 w-5" /> Confirm Details & Proceed (Concept)
                  </Button>
                   <Alert variant="default" className="mt-4 p-3 text-xs bg-muted/30 border-primary/30">
                      <Info className="h-4 w-4 !left-3 !top-3.5 text-primary/70" />
                      <AlertDescription>
                      This is a conceptual checkout. Clicking 'Confirm Details' will log your address. Payment method selection is for demonstration.
                      Cashfree payment is a conceptual frontend to backend call. The total amount is dynamically calculated.
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

                {isSubscriptionCheckout && subscriptionDetails ? (
                  <>
                    <h3 className="font-semibold text-primary">{subscriptionDetails.planName}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{subscriptionDetails.planFrequency} Delivery</p>
                    {subscriptionOrderItems.length > 0 && (
                       <>
                        <Separator className="my-2" />
                        <h4 className="text-sm font-medium mb-1">Selected Juices:</h4>
                        {subscriptionOrderItems.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            {item.image && (
                              <Image 
                                src={item.image} 
                                alt={item.name} 
                                width={32} 
                                height={32} 
                                className="rounded-sm object-cover border"
                                data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                                unoptimized={item.image.startsWith('https://placehold.co')}
                                onError={(e) => e.currentTarget.src = 'https://placehold.co/32x32.png'}
                              />
                            )}
                            <span className="flex-grow">{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                       </>
                    )}
                     <Separator className="my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold text-accent">Rs.0.00</span>
                    </div>
                     <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold text-primary">
                      <span>Total</span>
                      <span>Rs.{currentOrderTotal.toFixed(2)}</span>
                    </div>

                  </>
                ) : cartItems.length > 0 ? (
                  <>
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                         {item.image && (
                            <Image 
                                src={item.image} 
                                alt={item.name} 
                                width={32} 
                                height={32} 
                                className="rounded-sm object-cover border"
                                data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                                unoptimized={item.image.startsWith('https://placehold.co')}
                                onError={(e) => e.currentTarget.src = 'https://placehold.co/32x32.png'}
                              />
                         )}
                        <span className="flex-grow">{item.quantity}x {item.name}</span>
                        <span className="font-semibold text-accent">Rs.{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Subtotal</span>
                      <span className="text-accent">Rs.{getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold text-accent">Rs.{(currentOrderTotal - getCartTotal()).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 mt-3 flex justify-between text-lg font-bold text-primary">
                      <span>Total</span>
                      <span>Rs.{currentOrderTotal.toFixed(2)}</span>
                    </div>

                  </>
                ) : (
                  <div className="text-center py-6">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Your cart is empty.</p>
                    <Button asChild variant="link" className="mt-2 text-primary">
                        <Link href="/menu">Browse Our Juices</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading checkout...</p>
      </div>
    }>
      <CheckoutPageContents />
    </Suspense>
  );
}


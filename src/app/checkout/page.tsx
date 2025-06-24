"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CreditCard, ArrowLeft, MapPin, Info, AlertTriangle, Wallet, Loader2, ShoppingBag, Clock, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutAddressSchema } from '@/lib/zod-schemas';
import type { CheckoutAddressFormData, Juice as JuiceType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GoogleMapPicker from '@/components/checkout/GoogleMapPicker';
import { useCart } from '@/hooks/useCart';
import { JUICES } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { load } from "@cashfreepayments/cashfree-js";
import { useAuth } from '@/context/AuthContext';

interface SubscriptionOrderItem {
  id: string;
  juiceId: string;
  name: string;
  quantity: number;
  image?: string;
  dataAiHint?: string;
  juiceName?: string; // Added to fix compile error
}

// Add Cashfree SDK types
declare global {
  interface Window { // Added the load function to the window type
 cashfree: any; // Use 'any' for flexibility, or define a more specific type if available
    Cashfree: {
      init: (options: {
        onLoad: () => void;
        onScriptError?: (e: Error) => void;
      }) => void;
      checkout: any; // Use 'any' for flexibility, or define a more specific type if available
      load: (options: { mode: "sandbox" }) => Promise<any>; // Assuming a load function
    };
  }
}

function CheckoutPageContents() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user, loading: isAuthLoading } = useAuth(); // Enable user context
  const [isSubscriptionCheckout, setIsSubscriptionCheckout] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    planId: string;
    planName: string;
    planPrice: number;
    planFrequency: string;
    subscriptionDuration?: number;
    basePrice?: number;
  } | null>(null); // Explicitly initialize as null
  const [subscriptionOrderItems, setSubscriptionOrderItems] = useState<SubscriptionOrderItem[]>([]);
  const [currentOrderTotal, setCurrentOrderTotal] = useState(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      country: 'India',
    }
  });

  // Auto-populate email field with authenticated user's email
  useEffect(() => {
    if (user?.email) {
      setValue('email', user.email);
    }
  }, [user, setValue]);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    setIsLoadingSummary(true);
    const planId = searchParams.get('planId') as string | null;
    const planName = searchParams.get('planName') as string | null;
    const planPriceStr = searchParams.get('planPrice') as string | null;
    const planFrequency = searchParams.get('planFrequency') as string | null;
    const selectedJuicesStr = searchParams.get('selectedJuices');
    const subscriptionDurationStr = searchParams.get('subscriptionDuration');
    const basePriceStr = searchParams.get('basePrice');

    if (planId && planName && planPriceStr && planFrequency) {
      setIsSubscriptionCheckout(true);
      const planPrice = parseFloat(planPriceStr);
      const subscriptionDuration = subscriptionDurationStr ? parseInt(subscriptionDurationStr) : 3;
      const basePrice = basePriceStr ? parseFloat(basePriceStr) : 120;
      
      setSubscriptionDetails({ 
        planId, 
        planName, 
        planPrice, 
        planFrequency,
        subscriptionDuration,
        basePrice
      });
      setCurrentOrderTotal(planPrice); // Shipping is 0 for subscriptions

      if (selectedJuicesStr) {
        try {
          const parsedSelections: Record<string, number> = JSON.parse(selectedJuicesStr);
          const items: SubscriptionOrderItem[] = Object.entries(parsedSelections)
            .map(([juiceId, quantity]) => {
              const juiceInfo = JUICES.find(j => j.id === juiceId);
              return juiceInfo ? { 
                id: juiceInfo.id, 
                juiceId: juiceInfo.id,
                name: juiceInfo.name, 
                quantity, 
                image: juiceInfo.image, 
                dataAiHint: juiceInfo.dataAiHint 
              } : null;
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
    // Remove conceptual logging and toast
    // Instead, trigger the real Cashfree payment flow
    handleCashfreePayment();
  };

  let cashfree;
  var initializeSDK = async function () {          
      cashfree = await load({
          mode: "sandbox"
      });
  }
  initializeSDK();
  // // Use the asynchronous load function pattern
  // async function initializeCashfree() {
  //   if (typeof window === 'undefined' || !window.Cashfree || typeof window.Cashfree.load !== 'function') {
  //     // Attempt to load if not already available or if load function is missing
  //     await new Promise((resolve, reject) => {
  //       const script = document.createElement('script');
  //       script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  //       script.async = true;
  //       script.onload = () => resolve(true);
  //       script.onerror = () => reject(new Error('Failed to load Cashfree SDK script'));
  //       document.body.appendChild(script);
  //     });
  //   }
  //   // Potentially redirect or clear cart/subscription state here
  // };

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
  
  // Function to create a checkout session using the Cashfree SDK instance
  async function createCheckout(cashfree: any, paymentSessionId: string, returnUrl: string) {
    let checkoutOptions = {
      paymentSessionId: paymentSessionId,
      returnUrl: returnUrl,
    };
    try {
      cashfree.checkout(checkoutOptions).then((result: any) => {
      if (result.error) {
        // Only log error to console, no secrets or sensitive data
        console.error("Checkout error:", result.error.message);
      } 
      // No debug logs or secrets
      if(result.paymentDetails){
        // Payment completed, no logs
      }
    });
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  }

  const handleCashfreePayment = async () => {
    setIsProcessingPayment(true);
    toast({
 duration: 6000, // Extend duration for async process
      title: "Processing Payment...",
 description: "Creating order and initializing payment gateway...",
    });
    try {
    //    if (isAuthLoading) {
    //      toast({ title: "Authentication Loading", description: "Please wait while we verify your login status.", });
    //      setIsProcessingPayment(false);
    //      return;
    //    }
    //   if (!user) {
    //     toast({ title: "Authentication Required", description: "Please log in to complete your order.", variant: "destructive" });
    //     setIsProcessingPayment(false);
    //     // Optionally redirect to login page: router.push('/login');
    //     return;
    //   }
      let cashfreeInstance = await load({ mode: "sandbox" });
      // Initialize Cashfree SDK asynchronously
      initializeSDK(); // Ensure the script is loaded

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
      
      // Add validation for order amount
      if (currentOrderTotal > 10000) {
        throw new Error(`Order amount (₹${currentOrderTotal}) exceeds the maximum limit of ₹10,000 for sandbox payments. Please reduce the order amount or contact support.`);
      }
      
      if (currentOrderTotal < 1) {
        throw new Error("Order amount must be at least ₹1.");
      }
      
      console.log("Order validation passed. Current order total:", currentOrderTotal);
      
      const orderPayload = {
        orderAmount: currentOrderTotal,
        orderItems: (isSubscriptionCheckout ? subscriptionOrderItems : cartItems).map(item => ({
          ...item,
          juiceName: 'juiceName' in item && item.juiceName ? item.juiceName : item.name // Ensure juiceName is always present
        })),
        customerInfo: {
          name: `${(formData as CheckoutAddressFormData).firstName} ${(formData as CheckoutAddressFormData).lastName || ''}`.trim(),
          email: (formData as CheckoutAddressFormData).email,
          phone: (formData as CheckoutAddressFormData).mobileNumber,
          address: {
            line1: (formData as CheckoutAddressFormData).addressLine1,
            line2: (formData as CheckoutAddressFormData).addressLine2,
            city: (formData as CheckoutAddressFormData).city,
            state: (formData as CheckoutAddressFormData).state,
            zipCode: (formData as CheckoutAddressFormData).zipCode,
            country: (formData as CheckoutAddressFormData).country,
          }
        },
        userId: user?.id, // <-- Pass the userId to backend
        // Add subscription data if this is a subscription checkout
        subscriptionData: isSubscriptionCheckout ? {
          planId: subscriptionDetails?.planId,
          planName: subscriptionDetails?.planName,
          planPrice: subscriptionDetails?.planPrice,
          planFrequency: subscriptionDetails?.planFrequency,
          selectedJuices: subscriptionOrderItems.map(item => ({
            juiceId: item.juiceId,
            quantity: item.quantity
          })),
          subscriptionDuration: subscriptionDetails?.subscriptionDuration || 3,
          basePrice: subscriptionDetails?.basePrice || 120
        } : null
      };
      console.log("Preparing to send order data to /api/orders/create:", JSON.stringify(orderPayload));
      // const userId = user.id;
      // 1. Create order in your backend
      const orderCreationResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers:
         {
          // Correcting header for JSON content

          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });
      
      const orderCreationResult = await orderCreationResponse.json();

      if (!orderCreationResponse.ok || !orderCreationResult.success || !orderCreationResult.data?.id) {
        throw new Error(orderCreationResult.message || "Failed to create internal order.");
      }

      const internalOrderId = orderCreationResult.data.id;

      // 2. Use the internalOrderId to create a Cashfree order session
      const cashfreeOrderPayload = {
        orderAmount: currentOrderTotal,
        internalOrderId: internalOrderId,
        customerInfo: {
          name: `${(formData as CheckoutAddressFormData).firstName} ${(formData as CheckoutAddressFormData).lastName || ''}`.trim(),
          email: (formData as CheckoutAddressFormData).email,
          phone: (formData as CheckoutAddressFormData).mobileNumber,
       }
      };
      const cashfreeOrderResponse = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cashfreeOrderPayload),
      });

      const cashfreeOrderResult = await cashfreeOrderResponse.json();

      if (cashfreeOrderResponse.ok && cashfreeOrderResult.success && cashfreeOrderResult.data?.orderToken) {
         // Now that the SDK is loaded and order created, initiate checkout
         if (cashfreeInstance  && typeof cashfreeInstance .checkout === 'function') {
             createCheckout(cashfreeInstance , cashfreeOrderResult.data.orderToken, `${window.location.origin}/order-success`); // Replace with your actual success page URL
         } else {
             throw new Error("Cashfree SDK not available for checkout.");
         }
      } else {
        throw new Error(cashfreeOrderResult.message || "Failed to create Cashfree order session.");
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
  
  const handlePlaceSelected = (placeDetails: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    lat?: number;
    lng?: number;
  }) => {
    setValue('addressLine1', placeDetails.addressLine1, { shouldValidate: true });
    setValue('city', placeDetails.city, { shouldValidate: true });
    setValue('state', placeDetails.state, { shouldValidate: true });
    setValue('zipCode', placeDetails.zipCode, { shouldValidate: true });
    setValue('country', placeDetails.country || 'India', { shouldValidate: true });
    if (placeDetails.lat && placeDetails.lng) {
      setSelectedLocation({ lat: placeDetails.lat, lng: placeDetails.lng });
    }
  };

  const isCheckoutDisabled = isLoadingSummary || (isSubscriptionCheckout ? !subscriptionDetails : cartItems.length === 0);

  return (
    <>
      <div className="min-h-screen relative">
        {/* Enhanced Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-green-50 to-blue-50"></div>
          <Image src="/images/fruit-bowl-custom.jpg" alt="Checkout background" fill className="object-cover opacity-20 mix-blend-multiply pointer-events-none select-none" priority />
          {/* Floating elements for visual appeal - More bubbles */}
          <div className="absolute top-20 right-10 w-16 h-16 bg-primary/10 rounded-full opacity-40 animate-float"></div>
          <div className="absolute bottom-32 left-16 w-12 h-12 bg-accent/10 rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-32 left-20 w-14 h-14 bg-secondary/10 rounded-full opacity-35 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-16 right-24 w-10 h-10 bg-primary/15 rounded-full opacity-25 animate-float" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-40 right-32 w-18 h-18 bg-accent/12 rounded-full opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-40 left-8 w-8 h-8 bg-secondary/8 rounded-full opacity-20 animate-float" style={{ animationDelay: '5s' }}></div>
        </div>
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-8">
            <Button variant="outline" asChild className="mb-6 glass-card border-0 btn-hover-lift">
              <Link href={isSubscriptionCheckout ? `/subscriptions/subscribe?plan=${subscriptionDetails?.planId}` : "/cart"}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {isSubscriptionCheckout ? "Subscription Details" : "Cart"}
              </Link>
            </Button>

        <section className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-headline font-bold gradient-text mb-4">
            Checkout
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You&apos;re almost there! Complete your order and get fresh juices delivered to your door.
          </p>
        </section>

        {isLoadingSummary ? (
          <div className="flex justify-center items-center py-16">
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your order...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="glass-card border-0 shadow-glass-lg animate-fade-in">
                <CardHeader className="pb-6">
                  <CardTitle className="font-headline text-3xl gradient-text">Shipping & Payment</CardTitle>
                  <CardDescription className="text-base">
                    Please enter your shipping address and complete your payment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                    <Card className="glass border-0 shadow-soft">
                      <CardHeader className="pb-4">
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          Delivery Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="rounded-xl overflow-hidden border border-border/50">
                          <GoogleMapPicker 
                            location={selectedLocation} 
                            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID} 
                            onPlaceSelected={handlePlaceSelected} 
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                            <Input 
                              id="firstName" 
                              {...register("firstName")} 
                              placeholder="John" 
                              className="glass border-border/50 focus:border-primary/50 transition-all"
                            />
                            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                            <Input 
                              id="lastName" 
                              {...register("lastName")} 
                              placeholder="Doe" 
                              className="glass border-border/50 focus:border-primary/50 transition-all"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            {...register("email")} 
                            placeholder="you@example.com" 
                            className="glass border-border/50 focus:border-primary/50 transition-all"
                          />
                          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="mobileNumber" className="text-sm font-medium">Mobile Number</Label>
                          <Input 
                            id="mobileNumber" 
                            type="tel" 
                            {...register("mobileNumber")} 
                            placeholder="+91 98765 43210" 
                            className="glass border-border/50 focus:border-primary/50 transition-all"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="addressLine1" className="text-sm font-medium">Address Line 1 *</Label>
                          <Input 
                            id="addressLine1" 
                            {...register("addressLine1")} 
                            placeholder="123 Juice Street" 
                            className="glass border-border/50 focus:border-primary/50 transition-all"
                          />
                          {errors.addressLine1 && <p className="text-sm text-destructive">{errors.addressLine1.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="addressLine2" className="text-sm font-medium">Address Line 2 (Optional)</Label>
                          <Input 
                            id="addressLine2" 
                            {...register("addressLine2")} 
                            placeholder="Apartment, Suite, etc." 
                            className="glass border-border/50 focus:border-primary/50 transition-all"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                            <Input 
                              id="city" 
                              {...register("city")} 
                              placeholder="Your City" 
                              className="glass border-border/50 focus:border-primary/50 transition-all"
                            />
                            {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state" className="text-sm font-medium">State / Province *</Label>
                            <Input 
                              id="state" 
                              {...register("state")} 
                              placeholder="Your State" 
                              className="glass border-border/50 focus:border-primary/50 transition-all"
                            />
                            {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="zipCode" className="text-sm font-medium">ZIP / Postal Code *</Label>
                            <Input 
                              id="zipCode" 
                              {...register("zipCode")} 
                              placeholder="123456" 
                              className="glass border-border/50 focus:border-primary/50 transition-all"
                            />
                            {errors.zipCode && <p className="text-sm text-destructive">{errors.zipCode.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country" className="text-sm font-medium">Country *</Label>
                            <Input 
                              id="country" 
                              {...register("country")} 
                              className="glass border-border/50 focus:border-primary/50 transition-all"
                            />
                            {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0 shadow-soft">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-headline flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-primary" />
                          Payment Method
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                         {isCheckoutDisabled && (
                             <Alert variant="default" className="glass border-orange-200 bg-orange-50/50">
                                 <ShoppingBag className="h-5 w-5 text-orange-600" />
                                 <AlertTitle className="text-orange-800">No items to checkout</AlertTitle>
                                 <AlertDescription className="text-orange-700">
                                     {isSubscriptionCheckout ? "Subscription details are missing." : "Your cart is empty."} Please add items or select a subscription to proceed.
                                 </AlertDescription>
                                  {!isSubscriptionCheckout && (
                                      <Button asChild variant="link" className="mt-3 text-primary p-0 h-auto">
                                          <Link href="/menu">Browse Our Juices →</Link>
                                      </Button>
                                  )}
                             </Alert>
                         )}
                        
                        <div className="glass-card p-6 rounded-xl border border-primary/20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">Cashfree Payment</h4>
                              <p className="text-sm text-muted-foreground">Secure payment gateway with multiple options</p>
                            </div>
                          </div>
                          
                          <Button 
                            type="button" 
                            size="lg"
                            className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white rounded-xl py-4 text-lg font-medium btn-hover-lift shadow-soft-lg"
                            onClick={handleCashfreePayment}
                            disabled={isProcessingPayment || isCheckoutDisabled}
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Wallet className="mr-2 h-5 w-5" />
                                Pay Securely
                              </>
                            )}
                          </Button>
                          
                          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" />
                              Secure
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              Encrypted
                            </span>
                            <span className="flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              Protected
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                   
                    
                    <Button 
                      type="submit"
                      size="lg" 
                      className="w-full bg-gradient-to-r from-accent to-green-500 hover:from-accent/90 hover:to-green-500/90 text-white text-lg py-4 rounded-xl font-medium btn-hover-lift shadow-soft-lg mt-8"
                      disabled={isCheckoutDisabled}
                    >
                      <CreditCard className="mr-2 h-5 w-5" /> 
                      Complete Order
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="glass-card border-0 shadow-glass-lg sticky top-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <CardHeader className="pb-4">
                  <CardTitle className="font-headline text-2xl gradient-text">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                  {isSubscriptionCheckout && subscriptionDetails ? (
                    <div className="space-y-4">
                      <div className="glass p-4 rounded-xl border border-primary/20">
                        <h3 className="font-semibold text-lg text-primary mb-2">{subscriptionDetails.planName}</h3>
                        <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {subscriptionDetails.planFrequency} Delivery
                        </p>
                      </div>
                      
                      {subscriptionOrderItems.length > 0 && (
                         <div className="space-y-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent" />
                            Selected Juices:
                          </h4>
                          <div className="space-y-2">
                            {subscriptionOrderItems.map(item => (
                              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg glass">
                                {item.image && (
                                  <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    width={40} 
                                    height={40} 
                                    className="rounded-lg object-cover border border-border/50"
                                    data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                                    unoptimized={item.image.startsWith('https://placehold.co')}
                                    onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40.png'}
                                  />
                                )}
                                <span className="flex-grow text-sm">{item.quantity}x {item.name}</span>
                              </div>
                            ))}
                          </div>
                         </div>
                      )}
                      
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subscription Price</span>
                          <span className="font-medium">₹{subscriptionDetails.planPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery</span>
                          <span className="font-medium text-green-600">FREE</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">₹{currentOrderTotal.toFixed(2)}</span>
                        </div>
                        
                        {/* Amount limit warning for subscriptions */}
                        {currentOrderTotal > 8000 && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Amount Warning</AlertTitle>
                            <AlertDescription>
                              Order amount (₹{currentOrderTotal.toFixed(2)}) is approaching the sandbox limit of ₹10,000. 
                              Consider reducing the subscription duration or items.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {currentOrderTotal > 10000 && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Amount Exceeds Limit</AlertTitle>
                            <AlertDescription>
                              Order amount (₹{currentOrderTotal.toFixed(2)}) exceeds the maximum limit of ₹10,000 for test payments. 
                              Please reduce the order amount to proceed.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  ) : cartItems.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {cartItems.map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl glass">
                             {item.image && (
                                <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    width={48} 
                                    height={48} 
                                    className="rounded-lg object-cover border border-border/50"
                                    data-ai-hint={item.dataAiHint || item.name.toLowerCase()}
                                    unoptimized={item.image.startsWith('https://placehold.co')}
                                    onError={(e) => e.currentTarget.src = 'https://placehold.co/48x48.png'}
                                  />
                             )}
                            <div className="flex-grow">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-semibold text-primary">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">₹{getCartTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Charges</span>
                          <span className="font-medium">
                            {(currentOrderTotal - getCartTotal()) > 0 ? `₹${(currentOrderTotal - getCartTotal()).toFixed(2)}` : 'FREE'}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">₹{currentOrderTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="glass-card p-6 rounded-xl">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                        <p className="text-muted-foreground mb-4">Add some delicious juices to get started!</p>
                        <Button asChild className="bg-gradient-to-r from-primary to-accent text-white btn-hover-lift">
                            <Link href="/menu">Browse Our Juices</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Suspense fallback={
        <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading checkout...</p>
        </div>
      }>
        <CheckoutPageContents />
      </Suspense>
    </>
  );
}
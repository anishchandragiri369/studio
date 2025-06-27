"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, Package, ArrowLeft, ShoppingBag, Mail, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorFetchingOrders, setErrorFetchingOrders] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [hasSearchedByEmail, setHasSearchedByEmail] = useState(false);
  // Remove the redirect for non-authenticated users - allow them to access the page
  // useEffect(() => {
  //   if (!authLoading && !user && isSupabaseConfigured) {
  //     router.push('/login?redirect=/orders');
  //   }
  // }, [user, authLoading, router, isSupabaseConfigured]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'My Orders - Elixr';
    }
  }, []);
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setLoadingOrders(false);
        return;
      }

      // Only auto-fetch orders for authenticated users
      if (!user) {
        setLoadingOrders(false);
        return;
      }

      setLoadingOrders(true);
      setErrorFetchingOrders(null);      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['payment_success', 'Payment Success', 'delivered', 'shipped', 'processing']) // Only show successful/processed orders
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setErrorFetchingOrders('Failed to fetch orders. Please try again.');
        setOrders([]);      } else {
        setOrders(data as any[]);
      }
      setLoadingOrders(false);
    };

    if (user && isSupabaseConfigured) {
      fetchOrders();
    }
  }, [user, isSupabaseConfigured]);

  // Function to fetch orders by email for non-authenticated users
  const fetchOrdersByEmail = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      toast({
        title: "Service Unavailable",
        description: "Order lookup service is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoadingOrders(true);
    setErrorFetchingOrders(null);
    setHasSearchedByEmail(true);

    try {      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .in('status', ['payment_success', 'delivered', 'shipped', 'processing']) // Only show successful/processed orders
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders by email:', error);
        setErrorFetchingOrders('Failed to fetch orders. Please try again.');
        setOrders([]);
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again.",
          variant: "destructive",
        });      } else {
        setOrders(data as any[]);
        if (data.length === 0) {
          toast({
            title: "No Orders Found",
            description: `No orders found for email: ${email}`,
            variant: "default",
          });
        } else {
          toast({
            title: "Orders Found",
            description: `Found ${data.length} order(s) for ${email}`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchOrdersByEmail:', error);
      setErrorFetchingOrders('An unexpected error occurred.');
      setOrders([]);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching orders.",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrdersByEmail(guestEmail);
  };
  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSupabaseConfigured && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Order History Unavailable</AlertTitle>
          <AlertDescription>
            Order history is currently disabled due to a configuration issue. Please try again later.
          </AlertDescription>
        </Alert>
         <div className="mt-6 text-center">
            <Button variant="outline" asChild>
                <Link href="/account"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Account</Link>
            </Button>
        </div>
      </div>
    );
  }
    // Show different content for authenticated vs non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 z-0">
          <Image src="/images/fruit-bowl-custom.jpg" alt="Juice orders background" fill className="object-cover opacity-60 blur-sm pointer-events-none select-none" priority />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/80 via-yellow-50/80 to-pink-100/80 mix-blend-multiply" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <Button variant="outline" asChild className="mb-8">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          
          <section className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
              View Your Orders
            </h1>
            <p className="text-lg text-muted-foreground">
              Enter your email address to view your order history, or log in for a personalized experience.
            </p>
          </section>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* Login Option */}
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
                  <ShoppingBag className="text-primary" />
                  For Registered Users
                </CardTitle>
                <CardDescription>
                  Log in to see all your orders and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/login?redirect=/orders">Log In to View Orders</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Guest Email Lookup */}
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
                  <Mail className="text-primary" />
                  For Guest Orders
                </CardTitle>
                <CardDescription>
                  Enter the email address you used when placing your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guest-email">Email Address</Label>
                    <Input
                      id="guest-email"
                      type="email"
                      placeholder="you@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="w-full"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loadingOrders || !guestEmail.trim()}
                  >
                    {loadingOrders ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Find My Orders
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Show orders if found */}
            {hasSearchedByEmail && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Package className="text-primary" /> 
                    Orders for {guestEmail}
                  </CardTitle>
                  <CardDescription>
                    {orders.length > 0 
                      ? `Found ${orders.length} order(s)` 
                      : 'No orders found for this email address'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingOrders ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Searching for orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No orders found for this email address.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Make sure you entered the correct email address used during checkout.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {errorFetchingOrders && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorFetchingOrders}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (errorFetchingOrders) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Orders</AlertTitle>
          <AlertDescription>
            {errorFetchingOrders}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => setOrders([])} disabled={loadingOrders}>
                {loadingOrders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />} Retry Loading Orders
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <Image src="/images/fruit-bowl-custom.jpg" alt="Juice orders background" fill className="object-cover opacity-60 blur-sm pointer-events-none select-none" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/80 via-yellow-50/80 to-pink-100/80 mix-blend-multiply" />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-12">
        <Button variant="outline" asChild className="mb-8">
          <Link href="/account">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Account
          </Link>
        </Button>
        <section className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
            My Orders
          </h1>
          <p className="text-lg text-muted-foreground">Review your past orders with Elixr.</p>
        </section>        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <ShoppingBag className="text-primary" /> Your Order History
            </CardTitle>
            <CardDescription>A list of all your previous purchases.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
                <Button asChild variant="link" className="mt-2 text-primary">
                  <Link href="/menu">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to safely format date
function formatOrderDate(dateString: string | undefined): string {
  if (!dateString) {
    return 'N/A';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Error';
  }
}

// OrderCard component to display individual order details
function OrderCard({ order }: { order: any }) { // Using any to handle database vs type mismatches
  return (
    <Card className="bg-muted/30 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <CardTitle className="text-lg font-semibold text-primary">Order ID: {order.id}</CardTitle>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            order.status === 'Delivered' || order.status === 'payment_success' || order.status === 'Payment Success' ? 'bg-green-100 text-green-700' :
            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
            order.status === 'payment_pending' || order.status === 'Payment Pending' || order.status === 'Pending' ? 'bg-gray-100 text-gray-700' :
            order.status === 'payment_failed' || order.status === 'Payment Failed' ? 'bg-red-100 text-red-700' :
            'bg-orange-100 text-orange-700' // Other statuses
          }`}>
            {order.status === 'payment_success' ? 'Payment Success' : 
             order.status === 'payment_pending' ? 'Payment Pending' :
             order.status === 'payment_failed' ? 'Payment Failed' :
             order.status}
          </span>
        </div>
        <CardDescription className="text-xs">
          Date: {formatOrderDate(order.created_at || order.orderDate)}
          <span className="mx-1">|</span>
          Total: Rs.{typeof (order.total_amount || order.totalAmount) === 'number' && (order.total_amount || order.totalAmount) > 0 ? (order.total_amount || order.totalAmount).toFixed(2) : '—'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Separator className="my-2" />
        <h4 className="text-sm font-medium mb-1">Items:</h4>
        {order.items && order.items.map((item: any, idx: number) => (
          <div key={item.juiceId || idx} className="flex items-center gap-3 text-sm">
            {item.image && (
              <Image
                src={item.image}
                alt={item.juiceName || item.name || 'Order item image'}
                width={40}
                height={40}
                className="rounded object-contain border"
                data-ai-hint={(item.juiceName ? item.juiceName.toLowerCase().split(" ").slice(0,2).join(" ") : '')}
                unoptimized={item.image.startsWith('https://placehold.co')}
                onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40.png'}
              />
            )}
            <div className="flex-grow">
              <span>{item.quantity}x {item.juiceName || item.name || 'Unknown Juice'}</span>
            </div>
            <span className="text-muted-foreground">
              Rs.{typeof item.pricePerItem === 'number' && item.pricePerItem > 0 ? 
                (item.quantity * item.pricePerItem).toFixed(2) : 
                (typeof item.price === 'number' && item.price > 0 ? 
                  (item.quantity * item.price).toFixed(2) : '—')}
            </span>
          </div>
        ))}
        {(order.shipping_address || order.shippingAddress) && (
          <>
            <Separator className="my-2" />
            <h4 className="text-sm font-medium mb-1">Shipping Address:</h4>
            <p className="text-xs text-muted-foreground">
              {(order.shipping_address?.name || order.shippingAddress?.firstName)} {order.shipping_address?.lastName || order.shippingAddress?.lastName || ''}<br/>
              {(order.shipping_address?.address?.line1 || order.shipping_address?.addressLine1 || order.shippingAddress?.addressLine1)}{(order.shipping_address?.address?.line2 || order.shipping_address?.addressLine2 || order.shippingAddress?.addressLine2) ? `, ${order.shipping_address?.address?.line2 || order.shipping_address?.addressLine2 || order.shippingAddress?.addressLine2}` : ''}<br/>
              {(order.shipping_address?.address?.city || order.shipping_address?.city || order.shippingAddress?.city)}, {(order.shipping_address?.address?.state || order.shipping_address?.state || order.shippingAddress?.state)} {(order.shipping_address?.address?.zipCode || order.shipping_address?.zipCode || order.shippingAddress?.zipCode)}<br/>
              {(order.shipping_address?.address?.country || order.shipping_address?.country || order.shippingAddress?.country)}
            </p>
          </>
        )}
      </CardContent>
      <CardFooter className="pt-3">
        <Button variant="outline" size="sm" disabled>View Details / Reorder (Demo)</Button>
      </CardFooter>
    </Card>
  );
}


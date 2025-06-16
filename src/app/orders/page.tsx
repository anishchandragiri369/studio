"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, Package, ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrdersPage() {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorFetchingOrders, setErrorFetchingOrders] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/orders');
    }
  }, [user, authLoading, router, isSupabaseConfigured]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'My Orders - Elixr';
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user || !isSupabaseConfigured || !supabase) {
        setLoadingOrders(false);
        return;
      }

      setLoadingOrders(true);
      setErrorFetchingOrders(null);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setErrorFetchingOrders('Failed to fetch orders. Please try again.');
        setOrders([]);
      } else {
        setOrders(data as Order[]);
      }
      setLoadingOrders(false);
    };

    if (user && isSupabaseConfigured) {
      fetchOrders();
    }
  }, [user, isSupabaseConfigured]);

  if (authLoading || loadingOrders) {
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
  
  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please log in to view your orders.</p>
        <Button asChild>
          <Link href="/login?redirect=/orders">Log In</Link>
        </Button>
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
        </section>

        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <ShoppingBag className="text-primary" /> Your Order History
            </CardTitle>
            <CardDescription>A list of all your previous purchases.</CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
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
                  <Card key={order.id} className="bg-muted/30 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                         <CardTitle className="text-lg font-semibold text-primary">Order ID: {order.id}</CardTitle>
                         <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          order.status === 'Delivered' || order.status === 'Payment Success' ? 'bg-green-100 text-green-700' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'Pending' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700' // Cancelled or other
                        }`}>{order.status}</span>
                      </div>
                      <CardDescription className="text-xs">
                        Date: {formatOrderDate(order.orderDate)}
                         <span className="mx-1">|</span>
                        Total: Rs.{typeof order.total_amount === 'number' && order.total_amount > 0 ? order.total_amount.toFixed(2) : (typeof order.totalAmount === 'number' && order.totalAmount > 0 ? order.totalAmount.toFixed(2) : '—')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <Separator className="my-2" />
                      <h4 className="text-sm font-medium mb-1">Items:</h4>
                      {order.items.map((item, idx) => (
                        <div key={item.juiceId || idx} className="flex items-center gap-3 text-sm">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.juiceName || 'Order item image'}
                              width={40}
                              height={40}
                              className="rounded object-cover border"
                              data-ai-hint={(item.juiceName ? item.juiceName.toLowerCase().split(" ").slice(0,2).join(" ") : '')}
                              unoptimized={item.image.startsWith('https://placehold.co')}
                              onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40.png'}
                            />
                          )}
                          <div className="flex-grow">
                            <span>{item.quantity}x {item.juiceName || item.name || 'Unknown Juice'}</span>
                          </div>
                          <span className="text-muted-foreground">Rs.{typeof item.pricePerItem === 'number' && item.pricePerItem > 0 ? (item.quantity * item.pricePerItem).toFixed(2) : (typeof item.price === 'number' && item.price > 0 ? (item.quantity * item.price).toFixed(2) : '—')}</span>
                        </div>
                      ))}
                       {order.shippingAddress && (
                         <>
                          <Separator className="my-2" />
                          <h4 className="text-sm font-medium mb-1">Shipping Address:</h4>
                          <p className="text-xs text-muted-foreground">
                              {order.shippingAddress.firstName} {order.shippingAddress.lastName || ''}<br/>
                              {order.shippingAddress.addressLine1}{order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}<br/>
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br/>
                              {order.shippingAddress.country}
                          </p>
                         </>
                      )}
                    </CardContent>
                    <CardFooter className="pt-3">
                      <Button variant="outline" size="sm" disabled>View Details / Reorder (Demo)</Button>
                    </CardFooter>
                  </Card>
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
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Error';
  }
}


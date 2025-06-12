
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, Package, ArrowLeft, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { MOCK_USER_ORDERS } from '@/lib/constants';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrdersPage() {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const router = useRouter();

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

  // Use mock orders for now
  const orders: Order[] = MOCK_USER_ORDERS;

  return (
    <div className="container mx-auto px-4 py-12">
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
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'Pending' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700' // Cancelled or other
                      }`}>{order.status}</span>
                    </div>
                    <CardDescription className="text-xs">
                      Date: {new Date(order.orderDate).toLocaleDateString()}
                       <span className="mx-1">|</span>
                      Total: Rs.{order.totalAmount.toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <Separator className="my-2" />
                    <h4 className="text-sm font-medium mb-1">Items:</h4>
                    {order.items.map((item) => (
                      <div key={item.juiceId} className="flex items-center gap-3 text-sm">
                        {item.image && (
                          <Image 
                            src={item.image} 
                            alt={item.juiceName} 
                            width={40} 
                            height={40} 
                            className="rounded object-cover border"
                            data-ai-hint={item.juiceName.toLowerCase().split(" ").slice(0,2).join(" ")}
                            unoptimized={item.image.startsWith('https://placehold.co')}
                            onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40.png'}
                          />
                        )}
                        <div className="flex-grow">
                          <span>{item.quantity}x {item.juiceName}</span>
                        </div>
                        <span className="text-muted-foreground">Rs.{(item.quantity * item.pricePerItem).toFixed(2)}</span>
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
  );
}

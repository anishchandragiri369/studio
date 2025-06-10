
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ShoppingBag, Mail, User, Loader2, AlertTriangle, Package, Edit } from 'lucide-react';
import Link from 'next/link';
import { MOCK_USER_ORDERS } from '@/lib/constants'; // Using mock data
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AccountPage() {
  const { user, logOut, loading: authLoading, isSupabaseConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/account');
    }
  }, [user, authLoading, router, isSupabaseConfigured]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'My Account - Elixr';
    }
  }, []);

  const handleLogout = async () => {
    await logOut();
    router.push('/');
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
          <AlertTitle>Account Access Unavailable</AlertTitle>
          <AlertDescription>
            Account features are currently disabled due to a configuration issue. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!user) {
     // This case should ideally be handled by the redirect, but as a fallback:
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-4 py-12 text-center">
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please log in to view your account details.</p>
        <Button asChild>
          <Link href="/login?redirect=/account">Log In</Link>
        </Button>
      </div>
    );
  }

  // Use mock orders for now
  const orders: Order[] = MOCK_USER_ORDERS;

  const getInitials = (email: string) => {
    const parts = email.split('@')[0];
    const namePart = user.user_metadata?.full_name || parts;
    if (namePart) {
        const nameParts = namePart.split(' ');
        if (nameParts.length > 1) {
            return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
        }
        return namePart.substring(0, 2).toUpperCase();
    }
    return parts.substring(0, 2).toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
          My Account
        </h1>
        <p className="text-lg text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Account Details Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-3 border-2 border-primary">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User Avatar'} />
                <AvatarFallback className="text-3xl bg-muted text-primary font-semibold">
                  {user.email ? getInitials(user.email) : <User />}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-2xl">{user.user_metadata?.full_name || user.email?.split('@')[0]}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-sm">
                <Mail className="h-4 w-4" /> {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add more user details here if available, e.g., phone, address preferences */}
              <p className="text-xs text-muted-foreground text-center">Member since: {new Date(user.created_at).toLocaleDateString()}</p>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/account/edit-profile">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
              </Button>
              <Button onClick={handleLogout} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Log Out
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Order History Card */}
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <ShoppingBag className="text-primary" /> Order History
              </CardTitle>
              <CardDescription>Review your past orders with Elixr.</CardDescription>
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
                            'bg-red-100 text-red-700' // Cancelled
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
      </div>
    </div>
  );
}

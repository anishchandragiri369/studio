"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, ShoppingBag, Mail, User, Loader2, AlertTriangle, Package, Edit, Calendar, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/lib/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import RewardsDisplay from '@/components/account/RewardsDisplay';

export default function AccountPage() {
  const { user, logOut, loading: authLoading, isSupabaseConfigured } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorFetchingOrders, setErrorFetchingOrders] = useState<string | null>(null);

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
        .in('status', ['payment_success', 'Payment Success', 'delivered', 'shipped', 'processing']) // Only show successful/processed orders
        .order('created_at', { ascending: false });
      if (error) {
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

  const handleLogout = async () => {
    clearCart(); // Clear cart on logout
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
  // Check if user is admin
  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL || 
                  user?.user_metadata?.role === 'admin' ||
                  ['admin@elixr.com', 'anishbobby@gmail.com', 'anishchandragiri@gmail.com'].includes(user?.email || '');

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <Image src="/images/fruit-bowl-custom.jpg" alt="Account background" fill className="object-cover opacity-40 blur pointer-events-none select-none" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-indigo-50/80 to-purple-100/80 mix-blend-multiply" />
      </div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-12">
          {/* Account Info Section */}
          <section className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-3">
              My Account
            </h1>
            <p className="text-lg text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!</p>
          </section>          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
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
                </CardContent>                <CardFooter className="flex-col gap-3">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/account/edit-profile">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Link>
                  </Button>                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/my-subscriptions">
                        <Calendar className="mr-2 h-4 w-4" /> My Subscriptions
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/reports">
                          <FileSpreadsheet className="mr-2 h-4 w-4" /> Admin Reports
                      </Link>
                    </Button>
                  )}
                  <Button onClick={handleLogout} variant="destructive" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Rewards Display */}
              <RewardsDisplay />
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
                  {/* Orders are now fetched from the server, so this is just a placeholder message */}
                  <section className="mt-10">
                    <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
                    {loadingOrders ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : errorFetchingOrders ? (
                      <Alert variant="destructive" className="max-w-2xl mx-auto mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Loading Orders</AlertTitle>
                        <AlertDescription>{errorFetchingOrders}</AlertDescription>
                      </Alert>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>
                        <Button asChild variant="link" className="mt-2 text-primary">
                          <Link href="/menu">Start Shopping</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {orders.slice(0, 3).map((order) => (
                          <Card key={order.id} className="bg-muted/30 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <CardTitle className="text-lg font-semibold text-primary">Order ID: {order.id}</CardTitle>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  order.status === 'Payment Success' ? 'bg-green-100 text-green-700' :
                                  order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'Pending' ? 'bg-gray-100 text-gray-700' :
                                  'bg-red-100 text-red-700'
                                }`}>{order.status}</span>
                              </div>                              <CardDescription className="text-xs">
                                Date: {formatOrderDate((order as any).created_at || (order as any).orderDate)}
                                <span className="mx-1">|</span>
                                Total: Rs.{typeof (order as any).total_amount === 'number' && (order as any).total_amount > 0 ? (order as any).total_amount.toFixed(2) : (typeof (order as any).totalAmount === 'number' && (order as any).totalAmount > 0 ? (order as any).totalAmount.toFixed(2) : '—')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                              <Separator className="my-2" />
                              <h4 className="text-sm font-medium mb-1">Items:</h4>
                              {order.items.map((item: any, idx: number) => (
                                <div key={item.juiceId || idx} className="flex items-center gap-3 text-sm">
                                  {item.image && (
                                    <Image
                                      src={item.image}
                                      alt={item.juiceName || 'Order item image'}
                                      width={40}
                                      height={40}
                                      className="rounded object-contain border"
                                      data-ai-hint={(item.juiceName ? item.juiceName.toLowerCase().split(" ").slice(0,2).join(" ") : '')}
                                      unoptimized={item.image.startsWith('https://placehold.co')}
                                      onError={(e) => e.currentTarget.src = 'https://placehold.co/40x40.png'}
                                    />
                                  )}                                  <div className="flex-grow">
                                    <span>{item.quantity}x {(item as any).juiceName || (item as any).name || 'Unknown Juice'}</span>
                                  </div>
                                  <span className="text-muted-foreground">Rs.{typeof (item as any).pricePerItem === 'number' && (item as any).pricePerItem > 0 ? (item.quantity * (item as any).pricePerItem).toFixed(2) : (typeof (item as any).price === 'number' && (item as any).price > 0 ? (item.quantity * (item as any).price).toFixed(2) : '—')}</span>
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
                              <Button asChild variant="outline" size="sm">
                                <Link href="/orders">View All Orders</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

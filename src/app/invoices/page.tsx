"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, FileText, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import InvoiceDownloadButton from '@/components/orders/InvoiceDownloadButton';
import Link from 'next/link';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user_id: string;
  customer_info?: any;
}

export default function InvoicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [searchMode, setSearchMode] = useState<'user' | 'guest'>('user');

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!user || !supabase) return;

    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status, user_id')
        .eq('user_id', user.id)
        .in('status', ['payment_success', 'Payment Success', 'delivered', 'shipped', 'processing'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load your orders",
          variant: "destructive",
        });
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  // Search order by ID and email (for guest orders)
  const searchGuestOrder = async () => {
    if (!orderId.trim() || !email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both Order ID and email address",
        variant: "destructive",
      });
      return;
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive",
      });
      return;
    }

    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status, user_id, customer_info')
        .eq('id', orderId.trim())
        .single();

      if (error || !data) {
        toast({
          title: "Order Not Found",
          description: "No order found with the provided Order ID",
          variant: "destructive",
        });
        setOrders([]);
      } else {
        // Verify email for guest orders
        const orderEmail = data.customer_info?.email || data.user_id;
        if (!data.user_id && orderEmail !== email.trim()) {
          toast({
            title: "Access Denied",
            description: "The email address doesn't match this order",
            variant: "destructive",
          });
          setOrders([]);
        } else {
          setOrders([data]);
          toast({
            title: "Order Found",
            description: "You can now download the invoice for this order",
          });
        }
      }
    } catch (error) {
      console.error('Error searching order:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while searching",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user && searchMode === 'user') {
      fetchUserOrders();
    }
  }, [user, searchMode]);

  if (authLoading) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-headline font-bold text-primary mb-3">
          Download Invoices
        </h1>
        <p className="text-lg text-muted-foreground">
          Get your order invoices for tax and record keeping purposes.
        </p>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={searchMode === 'user' ? 'default' : 'outline'}
          onClick={() => setSearchMode('user')}
          disabled={!user}
        >
          My Orders
        </Button>
        <Button
          variant={searchMode === 'guest' ? 'default' : 'outline'}
          onClick={() => setSearchMode('guest')}
        >
          Guest Order
        </Button>
      </div>

      {searchMode === 'user' && user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Orders
            </CardTitle>
            <CardDescription>
              Select an order to download its invoice
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm">
                        Total: ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <InvoiceDownloadButton
                      orderId={order.id}
                      userId={order.user_id}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {searchMode === 'guest' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Guest Order
            </CardTitle>
            <CardDescription>
              Enter your Order ID and email address to download invoice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="e.g., ORD123456789"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={searchGuestOrder}
              disabled={loadingOrders || !orderId.trim() || !email.trim()}
              className="w-full"
            >
              {loadingOrders ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Find Order
                </>
              )}
            </Button>

            {orders.length > 0 && searchMode === 'guest' && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Found Order:</h3>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id.slice(-8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm">
                        Total: ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <InvoiceDownloadButton
                      orderId={order.id}
                      email={email}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!user && searchMode === 'user' && (
        <Alert>
          <AlertTitle>Login Required</AlertTitle>
          <AlertDescription>
            Please log in to view your order invoices. Or use the "Guest Order" option if you placed an order without an account.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

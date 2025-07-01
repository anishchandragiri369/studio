"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function DebugPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = async () => {
    if (!user || !supabase) return;
    
    setIsLoading(true);
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) {
        console.error('Error fetching subscriptions:', subscriptionsError);
      } else {
        setSubscriptions(subscriptionsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug Dashboard</CardTitle>
            <CardDescription>Please log in to view your data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug Dashboard</CardTitle>
            <CardDescription>Database connection not available</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">Supabase client is not configured. Please check your environment variables.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Debug Dashboard</CardTitle>
              <CardDescription>
                Debug your orders and subscriptions data
              </CardDescription>
            </div>
            <Button onClick={fetchUserData} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="font-semibold">Current User:</h4>
            <p className="text-sm text-muted-foreground">
              {user.email} (ID: <code className="bg-gray-100 px-1 rounded">{user.id}</code>)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
          <CardDescription>All orders for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders found</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold">Order #{order.id}</h5>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                      <p className="text-sm font-semibold">₹{order.total_amount}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <strong>Type:</strong> {order.order_type}
                    </div>
                    <div>
                      <strong>Items:</strong> {order.items?.length || 0}
                    </div>
                  </div>

                  {order.subscription_info && (
                    <div className="mt-3">
                      <strong className="text-sm">Subscription Info:</strong>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {formatJson(order.subscription_info)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({subscriptions.length})</CardTitle>
          <CardDescription>All subscriptions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground">
              No subscriptions found. This is likely the issue - subscriptions should be created after successful payment.
            </p>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold">{subscription.plan_name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(subscription.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                      <p className="text-sm font-semibold">₹{subscription.total_amount}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <strong>Plan ID:</strong> {subscription.plan_id}
                    </div>
                    <div>
                      <strong>Frequency:</strong> {subscription.frequency}
                    </div>
                    <div>
                      <strong>Duration:</strong> {subscription.duration_months} months
                    </div>
                  </div>

                  {subscription.juice_preferences && (
                    <div className="mt-3">
                      <strong className="text-sm">Juice Preferences:</strong>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {formatJson(subscription.juice_preferences)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debugging Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debugging Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={orders.length > 0 ? "default" : "destructive"}>
                {orders.length > 0 ? "✓" : "✗"}
              </Badge>
              <span>Orders are being created</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={subscriptions.length > 0 ? "default" : "destructive"}>
                {subscriptions.length > 0 ? "✓" : "✗"}
              </Badge>
              <span>Subscriptions are being created</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={orders.some(o => o.subscription_info) ? "default" : "destructive"}>
                {orders.some(o => o.subscription_info) ? "✓" : "✗"}
              </Badge>
              <span>Orders contain subscription_info</span>
            </div>

            {subscriptions.length === 0 && orders.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800">Likely Issues:</h4>
                <ul className="list-disc list-inside text-yellow-700 text-sm mt-1 space-y-1">
                  <li>Payment webhook is not being triggered after payment</li>
                  <li>Webhook is failing to reach your Netlify function</li>
                  <li>Subscription creation API is failing (check logs)</li>
                  <li>User ID mismatch between order and subscription</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

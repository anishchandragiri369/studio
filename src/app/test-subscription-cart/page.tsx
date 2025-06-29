"use client";

import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TestSubscriptionCartPage() {
  const { addSubscriptionToCart, cartItems, getRegularItems, getSubscriptionItems } = useCart();

  const testAddSubscription = () => {
    const testSubscriptionData = {
      planId: 'weekly-starter',
      planName: 'Weekly Starter Plan',
      planFrequency: 'weekly',
      subscriptionDuration: 4,
      basePrice: 299,
      selectedJuices: [
        { juiceId: 'orange-classic', quantity: 2 },
        { juiceId: 'apple-crisp', quantity: 1 }
      ]
    };

    addSubscriptionToCart(testSubscriptionData);
  };

  const regularItems = getRegularItems();
  const subscriptionItems = getSubscriptionItems();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Subscription Cart</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAddSubscription} className="w-full">
              Add Test Subscription to Cart
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/cart">View Cart</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/checkout">Go to Checkout</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Cart State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Total Items: {cartItems.length}</h3>
                <p>Regular Items: {regularItems.length}</p>
                <p>Subscription Items: {subscriptionItems.length}</p>
              </div>

              {cartItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Cart Contents:</h4>
                  {cartItems.map((item, index) => (
                    <div key={item.id} className="p-2 border rounded text-sm">
                      <p><strong>Type:</strong> {item.type}</p>
                      <p><strong>Name:</strong> {item.name}</p>
                      <p><strong>Price:</strong> ₹{item.price}</p>
                      <p><strong>Quantity:</strong> {item.quantity}</p>
                      {item.type === 'subscription' && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Plan: {item.subscriptionData.planName}</p>
                          <p>Frequency: {item.subscriptionData.planFrequency}</p>
                          <p>Duration: {item.subscriptionData.subscriptionDuration} weeks</p>
                          <p>Juices: {item.subscriptionData.selectedJuices.length} selected</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DeliveryWindowSelector from '@/components/subscriptions/DeliveryWindowSelector';

function DeliveryPreferencesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deliveryPreferences, setDeliveryPreferences] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get subscription data from URL params (if coming from subscription flow)
  const planId = searchParams.get('plan');
  const duration = searchParams.get('duration');
  const fromCart = searchParams.get('from') === 'cart';

  const handlePreferencesChange = (preferences: any) => {
    setDeliveryPreferences(preferences);
  };

  const handleContinue = () => {
    // If coming from cart, go back to cart
    if (fromCart) {
      router.push('/cart');
    } else {
      // Otherwise continue to checkout or cart
      router.push('/cart');
    }
  };

  const handleSkip = () => {
    // Allow users to skip delivery preferences setup
    if (fromCart) {
      router.push('/cart');
    } else {
      router.push('/cart');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href={fromCart ? '/cart' : '/subscriptions'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {fromCart ? 'Back to Cart' : 'Back to Subscriptions'}
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Set Your Delivery Preferences
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your preferred delivery time windows and customize your delivery schedule 
            for the best experience.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Delivery Time Preferences</CardTitle>
            <CardDescription>
              These preferences will be saved to your account and applied to all future deliveries. 
              You can update them anytime from your subscription dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryWindowSelector
              subscriptionId={undefined} // Will be set after subscription creation
              userId={undefined} // Will be set after user authentication
              onPreferencesChange={handlePreferencesChange}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="sm:w-auto w-full order-2 sm:order-1"
          >
            Skip for Now
          </Button>
          
          <div className="flex gap-3 sm:w-auto w-full order-1 sm:order-2">
            <Button 
              onClick={handleContinue}
              disabled={isSaving}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? 'Saving...' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flexible Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our delivery system automatically finds the best time slots based on your preferences. 
                If your preferred time isn't available, we'll use your alternative preference or 
                find the closest available slot.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Premium Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Some time windows may have additional fees during peak hours. These fees help us 
                manage delivery capacity and ensure reliable service during high-demand periods.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Indicator */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Subscription Setup Progress</span>
            <span>Step 2 of 3</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Plan Selected</span>
            <span>Delivery Preferences</span>
            <span>Payment & Confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPreferencesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeliveryPreferencesContent />
    </Suspense>
  );
}

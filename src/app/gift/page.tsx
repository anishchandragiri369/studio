'use client';

import { Suspense } from 'react';
import GiftSubscriptionForm from '@/components/subscriptions/GiftSubscriptionForm';

// Mock data - replace with actual API call
const availablePlans = [
  {
    id: 'weekly-kickstarter',
    name: 'Weekly Kickstarter',
    frequency: 'weekly',
    pricePerDelivery: 299,
    description: 'Perfect for starting your healthy journey with weekly fresh juice deliveries'
  },
  {
    id: 'monthly-wellness',
    name: 'Monthly Wellness',
    frequency: 'monthly',
    pricePerDelivery: 899,
    description: 'Complete monthly wellness package with premium juice selections'
  },
  {
    id: 'weekly-detox',
    name: 'Weekly Detox',
    frequency: 'weekly',
    pricePerDelivery: 399,
    description: 'Specialized detox juices delivered weekly for optimal cleansing'
  },
  {
    id: 'monthly-premium',
    name: 'Monthly Premium',
    frequency: 'monthly',
    pricePerDelivery: 1299,
    description: 'Premium juice collection with exotic fruits and superfoods'
  }
];

export default function GiftSubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Gift a Healthy Lifestyle 🎁
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Share the gift of health and wellness with your loved ones. Give them a subscription 
            to fresh, nutritious juices delivered right to their doorstep.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        }>
          <GiftSubscriptionForm availablePlans={availablePlans} />
        </Suspense>

        {/* Features Section */}
        <div className="mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              Why Gift a Subscription?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🥤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Fresh & Healthy</h3>
                <p className="text-gray-600">
                  Premium quality juices made from the freshest fruits and vegetables
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚚</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Convenient Delivery</h3>
                <p className="text-gray-600">
                  Regular deliveries right to their doorstep, no hassle required
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Thoughtful Gift</h3>
                <p className="text-gray-600">
                  Show you care about their health and wellness journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

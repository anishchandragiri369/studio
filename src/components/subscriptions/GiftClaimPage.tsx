'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, User, MapPin, Check, AlertCircle } from 'lucide-react';

interface GiftClaimPageProps {
  giftCode: string;
}

interface GiftSubscription {
  id: string;
  recipient_name: string;
  recipient_email: string;
  subscription_plan_id: string;
  subscription_duration: number;
  custom_message?: string;
  is_anonymous: boolean;
  total_amount: number;
  status: string;
  expires_at: string;
}

export default function GiftClaimPage({ giftCode }: GiftClaimPageProps) {
  const router = useRouter();
  const [gift, setGift] = useState<GiftSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  useEffect(() => {
    if (giftCode) {
      fetchGiftDetails();
    }
  }, [giftCode]);

  const fetchGiftDetails = async () => {
    try {
      const response = await fetch(`/api/gift-subscriptions?gift_code=${giftCode}`);
      const result = await response.json();

      if (response.ok) {
        setGift(result.gift);
      } else {
        setError(result.error || 'Gift not found');
      }
    } catch (err) {
      setError('Failed to load gift details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!gift || !deliveryAddress.addressLine1 || !deliveryAddress.city || !deliveryAddress.zipCode) {
      setError('Please fill in all required address fields');
      return;
    }

    setIsClaiming(true);
    setError('');

    try {
      const response = await fetch('/api/gift-subscriptions/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gift_code: giftCode,
          user_id: 'current-user-id', // Get from auth context
          delivery_address: deliveryAddress
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/account/subscriptions?claimed=true');
      } else {
        setError(result.error || 'Failed to claim gift');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading gift details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !gift) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gift Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gift) return null;

  const isExpired = new Date(gift.expires_at) < new Date();
  const isAlreadyClaimed = gift.status === 'claimed';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white">
          <div className="text-center">
            <Gift className="mx-auto h-16 w-16 mb-4" />
            <h1 className="text-3xl font-bold mb-2">You've Received a Gift!</h1>
            <p className="text-pink-100">
              {gift.is_anonymous ? 'Someone special' : 'A friend'} has gifted you a subscription
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Gift Details */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gift Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">For</p>
                <p className="font-semibold text-gray-800">{gift.recipient_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subscription Duration</p>
                <p className="font-semibold text-gray-800">{gift.subscription_duration} Months</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold text-gray-800">{gift.subscription_plan_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Value</p>
                <p className="font-semibold text-green-600 text-lg">₹{gift.total_amount}</p>
              </div>
            </div>
            
            {gift.custom_message && (
              <div className="mt-6 p-4 bg-white rounded border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 mb-1">Personal Message</p>
                <p className="italic text-gray-800">"{gift.custom_message}"</p>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {isExpired && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <div className="flex items-center text-red-800">
                <AlertCircle className="mr-2" size={20} />
                <span className="font-semibold">This gift has expired</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Gifts must be claimed within one year of being sent.
              </p>
            </div>
          )}

          {isAlreadyClaimed && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
              <div className="flex items-center text-green-800">
                <Check className="mr-2" size={20} />
                <span className="font-semibold">This gift has already been claimed</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Check your account for subscription details.
              </p>
            </div>
          )}

          {/* Address Form */}
          {!isExpired && !isAlreadyClaimed && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <MapPin className="mr-2 text-blue-500" />
                Delivery Address
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.addressLine1}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="House/Flat Number, Street"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.addressLine2}
                    onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Area, Landmark"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="pt-6 border-t">
                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
                >
                  {isClaiming ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Claiming Gift...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-3" size={24} />
                      Claim My Gift Subscription
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons for expired/claimed gifts */}
          {(isExpired || isAlreadyClaimed) && (
            <div className="pt-6 border-t">
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/subscriptions')}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Browse Subscriptions
                </button>
                <button
                  onClick={() => router.push('/account/subscriptions')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

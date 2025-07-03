'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, User, MapPin, Calendar, MessageSquare, Eye, EyeOff } from 'lucide-react';

interface GiftSubscriptionFormProps {
  availablePlans: Array<{
    id: string;
    name: string;
    frequency: string;
    pricePerDelivery: number;
    description: string;
  }>;
}

interface GiftFormData {
  recipient_email: string;
  recipient_name: string;
  recipient_phone: string;
  subscription_plan_id: string;
  subscription_duration: number;
  custom_message: string;
  delivery_date: string;
  is_anonymous: boolean;
  delivery_address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const durationOptions = [
  { months: 2, label: '2 Months', discount: 5 },
  { months: 3, label: '3 Months', discount: 10 },
  { months: 4, label: '4 Months', discount: 15 },
  { months: 6, label: '6 Months', discount: 20 },
  { months: 12, label: '12 Months', discount: 25 }
];

export default function GiftSubscriptionForm({ availablePlans }: GiftSubscriptionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GiftFormData>({
    recipient_email: '',
    recipient_name: '',
    recipient_phone: '',
    subscription_plan_id: '',
    subscription_duration: 3,
    custom_message: '',
    delivery_date: '',
    is_anonymous: false,
    delivery_address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });

  const selectedPlan = availablePlans.find(plan => plan.id === formData.subscription_plan_id);
  const selectedDuration = durationOptions.find(d => d.months === formData.subscription_duration);
  
  const calculateTotalPrice = () => {
    if (!selectedPlan || !selectedDuration) return 0;
    const basePrice = selectedPlan.pricePerDelivery * selectedDuration.months;
    const discountAmount = (basePrice * selectedDuration.discount) / 100;
    return basePrice - discountAmount;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.recipient_email && formData.recipient_name && formData.subscription_plan_id;
      case 2:
        return formData.subscription_duration && Object.values(formData.delivery_address).some(val => val.trim());
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gift-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          total_amount: calculateTotalPrice(),
          gifter_user_id: 'current-user-id' // Get from auth context
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/gift/success?code=${result.gift_subscription.gift_code}`);
      } else {
        alert(result.error || 'Failed to create gift subscription');
      }
    } catch (error) {
      console.error('Error creating gift subscription:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6">
          <div className="flex justify-between items-center text-white">
            {['Recipient', 'Plan & Duration', 'Message', 'Review'].map((step, index) => (
              <div key={step} className={`flex items-center ${index < 3 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep > index + 1 ? 'bg-white text-green-500' : 
                  currentStep === index + 1 ? 'bg-yellow-400 text-gray-800' : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium">{step}</span>
                {index < 3 && <div className="flex-1 h-1 bg-gray-300 mx-4 rounded" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Recipient Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <User className="mr-3 text-blue-500" />
                Recipient Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter recipient's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => handleInputChange('recipient_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="recipient@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.recipient_phone}
                    onChange={(e) => handleInputChange('recipient_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subscription Plan *
                  </label>
                  <select
                    value={formData.subscription_plan_id}
                    onChange={(e) => handleInputChange('subscription_plan_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a plan</option>
                    {availablePlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.pricePerDelivery}/{plan.frequency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedPlan && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">{selectedPlan.name}</h3>
                  <p className="text-sm text-blue-600">{selectedPlan.description}</p>
                  <p className="text-lg font-bold text-blue-800 mt-2">
                    ₹{selectedPlan.pricePerDelivery} per {selectedPlan.frequency} delivery
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Plan Duration & Address */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Calendar className="mr-3 text-green-500" />
                Duration & Delivery Address
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Subscription Duration *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {durationOptions.map(option => (
                    <button
                      key={option.months}
                      type="button"
                      onClick={() => handleInputChange('subscription_duration', option.months)}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        formData.subscription_duration === option.months
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-xs text-green-600">{option.discount}% OFF</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.delivery_address.addressLine1}
                    onChange={(e) => handleInputChange('delivery_address.addressLine1', e.target.value)}
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
                    value={formData.delivery_address.addressLine2}
                    onChange={(e) => handleInputChange('delivery_address.addressLine2', e.target.value)}
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
                    value={formData.delivery_address.city}
                    onChange={(e) => handleInputChange('delivery_address.city', e.target.value)}
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
                    value={formData.delivery_address.state}
                    onChange={(e) => handleInputChange('delivery_address.state', e.target.value)}
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
                    value={formData.delivery_address.zipCode}
                    onChange={(e) => handleInputChange('delivery_address.zipCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Custom Message */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <MessageSquare className="mr-3 text-purple-500" />
                Personal Message
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gift Message
                  </label>
                  <textarea
                    value={formData.custom_message}
                    onChange={(e) => handleInputChange('custom_message', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Write a personal message for the recipient..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.custom_message.length}/500 characters
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave blank to send immediately
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('is_anonymous', !formData.is_anonymous)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                      formData.is_anonymous
                        ? 'bg-gray-100 border-gray-400 text-gray-700'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                    }`}
                  >
                    {formData.is_anonymous ? <EyeOff size={20} /> : <Eye size={20} />}
                    <span>Send anonymously</span>
                  </button>
                  <p className="text-sm text-gray-500">
                    {formData.is_anonymous 
                      ? 'Your name will not be shown to the recipient'
                      : 'Recipient will know this gift is from you'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Gift className="mr-3 text-pink-500" />
                Review Your Gift
              </h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Recipient Details</h3>
                    <p><strong>Name:</strong> {formData.recipient_name}</p>
                    <p><strong>Email:</strong> {formData.recipient_email}</p>
                    {formData.recipient_phone && (
                      <p><strong>Phone:</strong> {formData.recipient_phone}</p>
                    )}
                    <p><strong>Anonymous:</strong> {formData.is_anonymous ? 'Yes' : 'No'}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Subscription Details</h3>
                    <p><strong>Plan:</strong> {selectedPlan?.name}</p>
                    <p><strong>Duration:</strong> {selectedDuration?.label}</p>
                    <p><strong>Discount:</strong> {selectedDuration?.discount}%</p>
                    {formData.delivery_date && (
                      <p><strong>Delivery Date:</strong> {formData.delivery_date}</p>
                    )}
                  </div>
                </div>
                
                {formData.custom_message && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Your Message</h3>
                    <p className="bg-white p-4 rounded border italic text-gray-700">
                      "{formData.custom_message}"
                    </p>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-800">₹{calculateTotalPrice()}</span>
                  </div>
                  {selectedDuration && selectedDuration.discount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      You saved ₹{((selectedPlan?.pricePerDelivery || 0) * selectedDuration.months * selectedDuration.discount) / 100} 
                      with {selectedDuration.discount}% duration discount!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2" size={20} />
                    Send Gift
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Crown, Sparkles, Award, Star } from 'lucide-react';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import type { SubscriptionDurationOption } from '@/lib/types';

interface SubscriptionDurationSelectorProps {
  basePrice: number; // Monthly price
  selectedDuration?: 2 | 3 | 4 | 6 | 12;
  onDurationSelect: (duration: 2 | 3 | 4 | 6 | 12, pricing: {
    originalPrice: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    discountType: string;
  }) => void;
}

const getDiscountIcon = (discountType: string) => {
  switch (discountType) {
    case 'bronze': return <Award className="h-4 w-4 text-amber-600" />;
    case 'silver': return <Star className="h-4 w-4 text-gray-500" />;
    case 'gold': return <Sparkles className="h-4 w-4 text-yellow-500" />;
    case 'platinum': return <Crown className="h-4 w-4 text-purple-600" />;
    default: return null;
  }
};

const getDiscountColor = (discountType: string) => {
  switch (discountType) {
    case 'bronze': return 'bg-amber-50 border-amber-200 text-amber-800';
    case 'silver': return 'bg-gray-50 border-gray-200 text-gray-800';
    case 'gold': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'platinum': return 'bg-purple-50 border-purple-200 text-purple-800';
    default: return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

export default function SubscriptionDurationSelector({ 
  basePrice, 
  selectedDuration, 
  onDurationSelect 
}: SubscriptionDurationSelectorProps) {
  const [selected, setSelected] = useState<string>(selectedDuration?.toString() || '');
  
  // For sandbox testing, reduce prices to avoid hitting the ₹10,000 limit
  const adjustedBasePrice = process.env.NODE_ENV === 'development' ? Math.min(basePrice, 50) : basePrice;
  
  const durationOptions = SubscriptionManager.getDurationOptions();

  const handleSelection = (value: string) => {
    setSelected(value);
    const duration = parseInt(value) as 2 | 3 | 4 | 6 | 12;
    const pricing = SubscriptionManager.calculateSubscriptionPricing(adjustedBasePrice, duration);
    onDurationSelect(duration, pricing);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Choose Your Subscription Duration
        </CardTitle>
        <CardDescription>
          Longer subscriptions get better discounts! Select the duration that works best for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={handleSelection} className="grid gap-4">          {durationOptions.map((option) => {
            const pricing = SubscriptionManager.calculateSubscriptionPricing(adjustedBasePrice, option.months);
            const isSelected = selected === option.months.toString();
            
            return (
              <div key={option.months} className="relative">
                <RadioGroupItem 
                  value={option.months.toString()} 
                  id={`duration-${option.months}`}
                  className="sr-only"
                />
                <Label 
                  htmlFor={`duration-${option.months}`}
                  className={`block cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getDiscountIcon(pricing.discountType)}
                        <h3 className="font-semibold text-lg">
                          {option.months === 12 ? '1 Year' : `${option.months} Months`}
                        </h3>
                        {pricing.discountPercentage > 0 && (
                          <Badge className={getDiscountColor(pricing.discountType)}>
                            {pricing.discountPercentage}% OFF
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Monthly Rate: ₹{adjustedBasePrice.toFixed(2)}</p>
                        {adjustedBasePrice !== basePrice && (
                          <p className="text-xs text-blue-600">
                            ⓘ Price reduced for testing (Original: ₹{basePrice.toFixed(2)})
                          </p>
                        )}
                        {pricing.discountPercentage > 0 ? (
                          <>
                            <p>Original Total: <span className="line-through">₹{pricing.originalPrice.toFixed(2)}</span></p>
                            <p className="text-green-600 font-medium">
                              You Save: ₹{pricing.discountAmount.toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <p>Total: ₹{pricing.originalPrice.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ₹{pricing.finalPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Amount
                      </div>
                      {pricing.discountPercentage > 0 && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          Best Value!
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Popular badge for 6 months */}
                  {option.months === 6 && (
                    <div className="absolute -top-2 left-4">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  {/* Best Value badge for 12 months */}
                  {option.months === 12 && (
                    <div className="absolute -top-2 left-4">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        Best Value
                      </Badge>
                    </div>
                  )}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Subscription Benefits:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• Fresh juices delivered to your door</li>
                <li>• Skip or pause deliveries anytime (24hr notice)</li>
                <li>• Exclusive subscriber-only flavors</li>
                <li>• Priority customer support</li>
                <li>• Free delivery on all orders</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

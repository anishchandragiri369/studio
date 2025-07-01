"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FruitBowlCard from '@/components/menu/FruitBowlCard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { FruitBowl, FruitBowlSubscriptionPlan } from '@/lib/types';
import { Calendar, Clock, MapPin, Package, Loader2, Check, X } from 'lucide-react';

interface SelectedBowls {
  [date: string]: { bowlId: string; quantity: number }[];
}

export default function FruitBowlSubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [fruitBowls, setFruitBowls] = useState<FruitBowl[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<FruitBowlSubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FruitBowlSubscriptionPlan | null>(null);
  const [selectedBowls, setSelectedBowls] = useState<SelectedBowls>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [startDate, setStartDate] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/subscribe/fruit-bowls');
      return;
    }

    const fetchData = async () => {
      try {
        const [bowlsResponse, plansResponse] = await Promise.all([
          fetch('/api/fruit-bowls'),
          fetch('/api/fruit-bowls/subscription-plans')
        ]);

        const [bowlsData, plansData] = await Promise.all([
          bowlsResponse.json(),
          plansResponse.json()
        ]);

        if (bowlsResponse.ok) setFruitBowls(bowlsData.fruitBowls);
        if (plansResponse.ok) setSubscriptionPlans(plansData.plans);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router, toast]);

  const handlePlanSelection = (plan: FruitBowlSubscriptionPlan) => {
    setSelectedPlan(plan);
    setCurrentStep(2);
    
    // Set default start date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
  };

  const handleBowlSelection = (date: string, fruitBowl: FruitBowl, quantity: number) => {
    setSelectedBowls(prev => {
      const dateSelections = prev[date] || [];
      const existingIndex = dateSelections.findIndex(s => s.bowlId === fruitBowl.id);
      
      let newSelections;
      if (quantity === 0) {
        // Remove the bowl
        newSelections = dateSelections.filter(s => s.bowlId !== fruitBowl.id);
      } else if (existingIndex >= 0) {
        // Update existing selection
        newSelections = [...dateSelections];
        newSelections[existingIndex] = { bowlId: fruitBowl.id, quantity };
      } else {
        // Add new selection
        newSelections = [...dateSelections, { bowlId: fruitBowl.id, quantity }];
      }

      return { ...prev, [date]: newSelections };
    });
  };

  const generateDeliveryDates = () => {
    if (!selectedPlan || !startDate) return [];
    
    const dates = [];
    const start = new Date(startDate);
    const durationDays = selectedPlan.duration_weeks * 7;
    
    for (let i = 0; i < durationDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getTotalBowlsForDate = (date: string) => {
    const selections = selectedBowls[date] || [];
    return selections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const calculateTotalPrice = () => {
    if (!selectedPlan) return 0;
    return selectedPlan.total_price;
  };

  const validateSelections = () => {
    const dates = generateDeliveryDates();
    
    for (const date of dates) {
      const totalBowls = getTotalBowlsForDate(date);
      if (totalBowls < selectedPlan!.min_bowls_per_delivery || totalBowls > selectedPlan!.max_bowls_per_delivery) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedPlan || !validateSelections()) {
      toast({
        title: "Invalid Selection",
        description: `Please select ${selectedPlan?.min_bowls_per_delivery}-${selectedPlan?.max_bowls_per_delivery} bowls for each day`,
        variant: "destructive"
      });
      return;
    }

    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode) {
      toast({
        title: "Address Required",
        description: "Please fill in your delivery address",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (selectedPlan.duration_weeks * 7) - 1);

      const response = await fetch('/api/fruit-bowls/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          startDate,
          endDate: endDate.toISOString().split('T')[0],
          deliveryAddress,
          selectedBowls,
          specialInstructions,
          totalAmount: calculateTotalPrice()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      toast({
        title: "Subscription Created!",
        description: "Your fruit bowl subscription has been created successfully",
      });

      router.push('/account/subscriptions');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subscription",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading subscription options...</span>
        </div>
      </div>
    );
  }

  const deliveryDates = generateDeliveryDates();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Plan Selection */}
      {currentStep === 1 && (
        <div>
          <h1 className="text-3xl font-bold text-center mb-8">Choose Your Fruit Bowl Plan</h1>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    <Badge>{plan.frequency}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{plan.duration_weeks} week{plan.duration_weeks > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bowls per day:</span>
                      <span>{plan.min_bowls_per_delivery}-{plan.max_bowls_per_delivery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deliveries:</span>
                      <span>Daily</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Price:</span>
                      <span>₹{plan.total_price}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handlePlanSelection(plan)}
                    className="w-full"
                  >
                    Select This Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Bowl Selection */}
      {currentStep === 2 && selectedPlan && (
        <div>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Select Your Daily Fruit Bowls</h1>
            <p className="text-muted-foreground">
              Choose {selectedPlan.min_bowls_per_delivery}-{selectedPlan.max_bowls_per_delivery} bowls for each day
            </p>
          </div>

          {deliveryDates.map((date, index) => {
            const totalBowls = getTotalBowlsForDate(date);
            const isValidSelection = totalBowls >= selectedPlan.min_bowls_per_delivery && 
                                   totalBowls <= selectedPlan.max_bowls_per_delivery;

            return (
              <Card key={date} className={`mb-6 ${!isValidSelection ? 'border-destructive' : 'border-green-500'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Day {index + 1} - {new Date(date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Selected: {totalBowls}</span>
                      {isValidSelection ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fruitBowls.map((bowl) => (
                      <FruitBowlCard
                        key={bowl.id}
                        fruitBowl={bowl}
                        isSelectionMode={true}
                        maxQuantity={selectedPlan.max_bowls_per_delivery}
                        onSelect={(fruitBowl, quantity) => handleBowlSelection(date, fruitBowl, quantity)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back to Plans
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)}
              disabled={!validateSelections()}
            >
              Continue to Details
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Delivery Details */}
      {currentStep === 3 && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Delivery Details</h1>
          
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Delivery Address</h3>
                <Input
                  placeholder="Street Address"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={deliveryAddress.city}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder="State"
                    value={deliveryAddress.state}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Pincode"
                    value={deliveryAddress.pincode}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, pincode: e.target.value }))}
                  />
                  <Input
                    placeholder="Landmark (Optional)"
                    value={deliveryAddress.landmark}
                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, landmark: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any special delivery instructions..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back to Selection
            </Button>
            <Button onClick={() => setCurrentStep(4)}>
              Review Order
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Order Review */}
      {currentStep === 4 && selectedPlan && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Review Your Order</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscription Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Plan:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{selectedPlan.duration_weeks} week{selectedPlan.duration_weeks > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Start Date:</span>
                <span>{new Date(startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Days:</span>
                <span>{deliveryDates.length}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{calculateTotalPrice()}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              Back to Details
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Subscription'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

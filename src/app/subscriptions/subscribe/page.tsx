"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { SUBSCRIPTION_PLANS, JUICES as FALLBACK_JUICES } from '@/lib/constants';
import SubscriptionDurationSelector from '@/components/subscriptions/SubscriptionDurationSelector';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import type { SubscriptionPlan, Juice, FruitBowl } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { fetchPlanDefaults, convertDefaultsToSelection, type PlanDefault } from '@/lib/planDefaults';
import CategoryBasedSubscription from '@/components/subscriptions/CategoryBasedSubscription';
import { calculateCategoryDistribution, convertDistributionToSelections } from '@/lib/categorySubscriptionHelper';

type CustomSelections = Record<string, number>; // { juiceId: quantity }
type FruitBowlSelections = Record<string, number>; // { fruitBowlId: quantity }

function SubscribePageContents() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter
  const { addSubscriptionToCart } = useCart(); // Add cart functionality
  const planId = searchParams.get('plan');
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  const [customSelections, setCustomSelections] = useState<CustomSelections>({});
  const [fruitBowlSelections, setFruitBowlSelections] = useState<FruitBowlSelections>({});
  const [totalSelectedJuices, setTotalSelectedJuices] = useState(0);
  const [totalSelectedFruitBowls, setTotalSelectedFruitBowls] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 3 | 4 | 6 | 12>(selectedPlan?.frequency === 'weekly' ? 2 : 3);
  const [selectedPricing, setSelectedPricing] = useState<any>(null);
  const [fruitBowls, setFruitBowls] = useState<FruitBowl[]>([]);
  const [juices, setJuices] = useState<Juice[]>([]); // Start empty, will be populated from API
  const [juicesLoaded, setJuicesLoaded] = useState(false); // Track if database juices are loaded
  const [userInstructions, setUserInstructions] = useState('');
  const [planDefaults, setPlanDefaults] = useState<PlanDefault[]>([]);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryJuices, setCategoryJuices] = useState<Juice[]>([]);
  
  useEffect(() => {
    if (selectedPlan && selectedPlan.isCustomizable) {
      // Initialize fruit bowl selections (these remain hardcoded for now)
      if (selectedPlan.defaultFruitBowls) {
        const initialFruitBowlSelections: FruitBowlSelections = {};
        let initialFruitBowlTotal = 0;
        selectedPlan.defaultFruitBowls.forEach(dfb => {
          initialFruitBowlSelections[dfb.fruitBowlId] = dfb.quantity;
          initialFruitBowlTotal += dfb.quantity;
        });
        setFruitBowlSelections(initialFruitBowlSelections);
        setTotalSelectedFruitBowls(initialFruitBowlTotal);
      } else {
        setFruitBowlSelections({});
        setTotalSelectedFruitBowls(0);
      }
    } else {
      setCustomSelections({});
      setFruitBowlSelections({});
      setTotalSelectedJuices(0);
      setTotalSelectedFruitBowls(0);
    }

    // Initialize pricing when plan loads
    if (selectedPlan) {
      const initialPricing = SubscriptionManager.calculateSubscriptionPricing(
        selectedPlan.pricePerDelivery, 
        selectedDuration,
        selectedPlan.frequency
      );
      setSelectedPricing(initialPricing);
    }
  }, [selectedPlan, selectedDuration]);
  
  useEffect(() => {
    const currentJuiceTotal = Object.values(customSelections).reduce((sum, qty) => sum + qty, 0);
    setTotalSelectedJuices(currentJuiceTotal);
  }, [customSelections]);

  useEffect(() => {
    const currentFruitBowlTotal = Object.values(fruitBowlSelections).reduce((sum, qty) => sum + qty, 0);
    setTotalSelectedFruitBowls(currentFruitBowlTotal);
  }, [fruitBowlSelections]);

  // Fetch fruit bowls from API
  useEffect(() => {
    const fetchFruitBowls = async () => {
      try {
        const response = await fetch('/api/fruit-bowls');
        if (response.ok) {
          const data = await response.json();
          // The API returns { fruitBowls: [...] }
          const fruitBowlsArray = data.fruitBowls || data || [];
          // Ensure data is an array
          if (Array.isArray(fruitBowlsArray)) {
            setFruitBowls(fruitBowlsArray);
          } else {
            console.error('Fruit bowls data is not an array:', data);
            setFruitBowls([]);
          }
        } else {
          console.error('Failed to fetch fruit bowls:', response.status, response.statusText);
          setFruitBowls([]);
        }
      } catch (error) {
        console.error('Error fetching fruit bowls:', error);
        setFruitBowls([]);
      }
    };

    fetchFruitBowls();
  }, []);

  // Fetch juices from API
  useEffect(() => {
    const fetchJuices = async () => {
      try {
        const response = await fetch('/api/juices');
        if (response.ok) {
          const data = await response.json();
          // The API returns { juices: [...] }
          const juicesArray = data.juices || data || [];
          // Ensure data is an array
          if (Array.isArray(juicesArray)) {
            setJuices(juicesArray);
            setJuicesLoaded(true);
          } else {
            console.error('Juices data is not an array:', data);
            setJuices(FALLBACK_JUICES); // Fallback to constants
            setJuicesLoaded(true);
          }
        } else {
          console.error('Failed to fetch juices:', response.status, response.statusText);
          setJuices(FALLBACK_JUICES); // Fallback to constants
          setJuicesLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching juices:', error);
        setJuices(FALLBACK_JUICES); // Fallback to constants
        setJuicesLoaded(true);
      }
    };

    fetchJuices();
  }, []);

  // Fetch plan defaults from database
  useEffect(() => {
    const loadPlanDefaults = async () => {
      if (!selectedPlan || !selectedPlan.isCustomizable) {
        setPlanDefaults([]);
        return;
      }

      setIsLoadingDefaults(true);
      try {
        const defaultsData = await fetchPlanDefaults(selectedPlan.id);
        setPlanDefaults(defaultsData.defaults);
        
        // Initialize juice selections from database defaults
        if (defaultsData.defaults.length > 0 && Object.keys(customSelections).length === 0) {
          const initialSelections = convertDefaultsToSelection(defaultsData.defaults);
          
          // Check if defaults exceed the plan limit and adjust if necessary
          let adjustedSelections: CustomSelections = { ...initialSelections };
          let totalFromDefaults = Object.values(initialSelections).reduce((sum, qty) => sum + qty, 0);
          
          if (selectedPlan.maxJuices && totalFromDefaults > selectedPlan.maxJuices) {
            console.warn(`Plan defaults exceed limit: ${totalFromDefaults} > ${selectedPlan.maxJuices}. Adjusting...`);
            
            // Reduce quantities to fit within the limit, prioritizing first juices in the list
            adjustedSelections = {};
            let remainingSlots = selectedPlan.maxJuices;
            
            for (const [juiceId, quantity] of Object.entries(initialSelections)) {
              if (remainingSlots <= 0) break;
              
              const adjustedQty = Math.min(quantity, remainingSlots);
              adjustedSelections[juiceId] = adjustedQty;
              remainingSlots -= adjustedQty;
            }
            
            totalFromDefaults = Object.values(adjustedSelections).reduce((sum, qty) => sum + qty, 0);
          }
          
          setCustomSelections(adjustedSelections);
          setTotalSelectedJuices(totalFromDefaults);
        }
      } catch (error) {
        console.error('Error loading plan defaults:', error);
        // Fallback to hardcoded defaults if database fails
        if (selectedPlan.defaultJuices && Object.keys(customSelections).length === 0) {
          const initialJuiceSelections: CustomSelections = {};
          selectedPlan.defaultJuices.forEach(dj => {
            if (juices.some(j => j.id === dj.juiceId)) {
              initialJuiceSelections[dj.juiceId] = dj.quantity;
            }
          });
          
          // Check if hardcoded defaults exceed the plan limit and adjust if necessary
          let adjustedSelections: CustomSelections = { ...initialJuiceSelections };
          let totalFromDefaults = Object.values(initialJuiceSelections).reduce((sum, qty) => sum + qty, 0);
          
          if (selectedPlan.maxJuices && totalFromDefaults > selectedPlan.maxJuices) {
            console.warn(`Hardcoded defaults exceed limit: ${totalFromDefaults} > ${selectedPlan.maxJuices}. Adjusting...`);
            
            // Reduce quantities to fit within the limit, prioritizing first juices in the list
            adjustedSelections = {};
            let remainingSlots = selectedPlan.maxJuices;
            
            for (const [juiceId, quantity] of Object.entries(initialJuiceSelections)) {
              if (remainingSlots <= 0) break;
              
              const adjustedQty = Math.min(quantity, remainingSlots);
              adjustedSelections[juiceId] = adjustedQty;
              remainingSlots -= adjustedQty;
            }
            
            totalFromDefaults = Object.values(adjustedSelections).reduce((sum, qty) => sum + qty, 0);
          }
          
          setCustomSelections(adjustedSelections);
          setTotalSelectedJuices(totalFromDefaults);
        }
      } finally {
        setIsLoadingDefaults(false);
      }
    };

    loadPlanDefaults();
  }, [selectedPlan, juices, customSelections]);

  if (typeof window !== 'undefined') {
    document.title = selectedPlan ? `Subscribe to ${selectedPlan.name} - Elixr` : 'Choose a Subscription - Elixr';
  }

  const handleQuantityChange = (juiceId: string, newQuantity: number) => {
    if (!selectedPlan?.maxJuices) return;
    if (newQuantity > selectedPlan.maxJuices) return; // Only block if this juice exceeds its cap
    setCustomSelections(prev => ({
      ...prev,
      [juiceId]: newQuantity
    }));
  };

  const handleFruitBowlQuantityChange = (fruitBowlId: string, newQuantity: number) => {
    if (!selectedPlan?.maxFruitBowls) return;
    if (newQuantity > selectedPlan.maxFruitBowls) return; // Only block if this fruit bowl exceeds its cap
    setFruitBowlSelections(prev => ({
      ...prev,
      [fruitBowlId]: newQuantity
    }));
  };

  // Calculate total days based on plan frequency
  const getTotalDays = (frequency: string) => {
    if (frequency === 'weekly') {
      return 6; // 6 days total
    } else if (frequency === 'monthly') {
      return 20; // 20 days total
    }
    return 1; // Fallback
  };

  const totalDays = selectedPlan ? getTotalDays(selectedPlan.frequency) : 0;
  
  // Use plan limits directly - user can choose any distribution
  const totalJuiceLimit = selectedPlan ? selectedPlan.maxJuices : 0;
  const totalFruitBowlLimit = selectedPlan ? selectedPlan.maxFruitBowls : 0;

  // Helper function to check if adding a specific juice would exceed the individual limit
  const canAddJuice = (juiceId: string) => {
    if (!selectedPlan?.maxJuices) return true;
    const currentQty = customSelections[juiceId] || 0;
    // Individual juice quantity cannot exceed the plan limit
    return currentQty < selectedPlan.maxJuices;
  };

  // Helper function to check if adding a specific fruit bowl would exceed the individual limit
  const canAddFruitBowl = (fruitBowlId: string) => {
    if (!selectedPlan?.maxFruitBowls) return true;
    const currentQty = fruitBowlSelections[fruitBowlId] || 0;
    // Individual fruit bowl quantity cannot exceed the plan limit
    return currentQty < selectedPlan.maxFruitBowls;
  };

  const canAddMore = selectedPlan?.maxJuices && totalJuiceLimit ? totalSelectedJuices < totalJuiceLimit : true;
  const canAddMoreFruitBowls = selectedPlan?.maxFruitBowls && totalFruitBowlLimit ? totalSelectedFruitBowls < totalFruitBowlLimit : true;
  const handleDurationSelect = (duration: 1 | 2 | 3 | 4 | 6 | 12, pricing: any) => {
    setSelectedDuration(duration);
    setSelectedPricing(pricing);
  };

  const handleCategorySelect = (category: string | null, juices: Juice[]) => {
    setSelectedCategory(category);
    setCategoryJuices(juices);
    
    // If category is selected, update custom selections with category-based distribution
    if (category && juices.length > 0 && selectedPlan) {
      const distribution = calculateCategoryDistribution(category, juices, selectedPlan);
      const newSelections = convertDistributionToSelections(distribution);
      
      setCustomSelections(newSelections);
      setTotalSelectedJuices(Object.values(newSelections).reduce((sum, qty) => sum + qty, 0));
    } else if (!category) {
      // Reset to defaults when switching back to customized
      setCustomSelections({});
      setTotalSelectedJuices(0);
    }
  };


  const handleProceedToCheckout = () => {
    console.log('Adding subscription to cart');
    
    if (!selectedPlan) {
      console.error('No selected plan');
      return;
    }
    
    if (!selectedPricing) {
      console.error('No selected pricing - initializing now');
      // Try to initialize pricing if it's missing
      const pricing = SubscriptionManager.calculateSubscriptionPricing(
        selectedPlan.pricePerDelivery, 
        selectedDuration,
        selectedPlan.frequency
      );
      setSelectedPricing(pricing);
      
      // Use the calculated pricing for adding to cart
      const subscriptionData = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planFrequency: selectedPlan.frequency,
        subscriptionDuration: selectedDuration,
        basePrice: pricing.finalPrice, // Use final price with discount
        selectedJuices: selectedPlan.isCustomizable && (selectedPlan.planType === 'juice-only' || selectedPlan.planType === 'customized')
          ? Object.entries(customSelections).map(([juiceId, quantity]) => ({ juiceId, quantity }))
          : planDefaults.map(d => ({ juiceId: d.juiceId.toString(), quantity: d.quantity })) || [],
        selectedFruitBowls: selectedPlan.isCustomizable && (selectedPlan.planType === 'fruit-bowl-only' || selectedPlan.planType === 'customized')
          ? Object.entries(fruitBowlSelections).map(([fruitBowlId, quantity]) => ({ fruitBowlId, quantity }))
          : selectedPlan.defaultFruitBowls || []
      };
      
      addSubscriptionToCart(subscriptionData);
      router.push('/cart');
      return;
    }

    // Add subscription to cart with proper data structure
    const subscriptionData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planFrequency: selectedPlan.frequency,
      subscriptionDuration: selectedDuration,
      basePrice: selectedPricing.finalPrice, // Use final price with discount
              selectedJuices: selectedPlan.isCustomizable && (selectedPlan.planType === 'juice-only' || selectedPlan.planType === 'customized')
          ? Object.entries(customSelections).map(([juiceId, quantity]) => ({ juiceId, quantity }))
          : planDefaults.map(d => ({ juiceId: d.juiceId.toString(), quantity: d.quantity })) || [],
      selectedFruitBowls: selectedPlan.isCustomizable && (selectedPlan.planType === 'fruit-bowl-only' || selectedPlan.planType === 'customized')
        ? Object.entries(fruitBowlSelections).map(([fruitBowlId, quantity]) => ({ fruitBowlId, quantity }))
        : selectedPlan.defaultFruitBowls || []
    };
    
    addSubscriptionToCart(subscriptionData);
    router.push('/cart');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="outline" asChild className="mb-8">
        <Link href="/subscriptions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Plans
        </Link>
      </Button>

      {/* User Instructions Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <label htmlFor="user-instructions" className="block font-semibold text-blue-900 mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          id="user-instructions"
          className="w-full p-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          rows={3}
          placeholder="Let us know if you have any special requirements, delivery instructions, or preferences."
          value={userInstructions}
          onChange={e => setUserInstructions(e.target.value)}
        />
      </div>

      {selectedPlan ? (
        <Card className="max-w-2xl mx-auto shadow-xl animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Confirm Your Subscription</CardTitle>
            <CardDescription>You are about to subscribe to the following plan:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted/50 rounded-lg">
              <h2 className="text-2xl font-semibold font-headline mb-2 text-primary">{selectedPlan.name}</h2>
              <p className="text-muted-foreground capitalize mb-1">{selectedPlan.frequency} Delivery</p>
              <p className="text-2xl font-bold text-accent mb-3">
                Rs.{selectedPlan.pricePerDelivery.toFixed(2)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{selectedPlan.frequency === 'weekly' ? 'week' : 'month'}
                </span>
              </p>
              <p className="text-sm">{selectedPlan.description}</p>
              {!selectedPlan.isCustomizable && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-1">Includes:</h4>
                  <div className="space-y-2">
                    {selectedPlan.defaultJuices && selectedPlan.defaultJuices.length > 0 && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">Juices:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {selectedPlan.defaultJuices.map(dj => {
                            const juiceInfo = juices.find(j => j.id === dj.juiceId) || FALLBACK_JUICES.find(j => j.id === dj.juiceId);
                            return (
                              <li key={dj.juiceId}>{dj.quantity}x {juiceInfo ? juiceInfo.name : `Juice (ID: ${dj.juiceId})`}</li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                    {selectedPlan.defaultFruitBowls && selectedPlan.defaultFruitBowls.length > 0 && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">Fruit Bowls:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {selectedPlan.defaultFruitBowls.map(fb => {
                            const fruitBowlInfo = fruitBowls.find((f: FruitBowl) => f.id === fb.fruitBowlId);
                            return (
                              <li key={fb.fruitBowlId}>{fb.quantity}x {fruitBowlInfo ? fruitBowlInfo.name : `Fruit Bowl (ID: ${fb.fruitBowlId})`}</li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedPlan.isCustomizable && juicesLoaded && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-1">Default Selection:</h4>
                  <div className="space-y-2">
                    {planDefaults.length > 0 && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">Juices:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {planDefaults.map(defaultItem => (
                            <li key={defaultItem.juiceId}>{defaultItem.quantity}x {defaultItem.juice.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Object.keys(fruitBowlSelections).length > 0 && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">Fruit Bowls:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {Object.entries(fruitBowlSelections).map(([fruitBowlId, quantity]) => {
                            const fruitBowlInfo = fruitBowls.find((f: FruitBowl) => f.id === fruitBowlId);
                            return (
                              <li key={fruitBowlId}>{quantity}x {fruitBowlInfo ? fruitBowlInfo.name : `Fruit Bowl (ID: ${fruitBowlId})`}</li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedPlan.isCustomizable && !juicesLoaded && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm mb-1">Default Selection:</h4>
                  <div className="space-y-2">
                    {planDefaults.length > 0 && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">Juices:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {planDefaults.map(defaultItem => (
                            <li key={defaultItem.juiceId}>{defaultItem.quantity}x {defaultItem.juice.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Object.keys(fruitBowlSelections).length > 0 && (
                      <div>
                        <h5 className="font-medium text-xs text-muted-foreground mb-1">Fruit Bowls:</h5>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {Object.entries(fruitBowlSelections).map(([fruitBowlId, quantity]) => (
                            <li key={fruitBowlId}>{quantity}x Fruit Bowl (ID: {fruitBowlId})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}            </div>

            {/* Duration Selector */}            <div className="space-y-4">
              <SubscriptionDurationSelector
                basePrice={selectedPlan.pricePerDelivery}
                frequency={selectedPlan.frequency}
                selectedDuration={selectedDuration}
                onDurationSelect={handleDurationSelect}
              />
            </div>

            {/* Category-Based Selection - only for juice-only and customized plans */}
            {selectedPlan.isCustomizable && (selectedPlan.planType === 'juice-only' || selectedPlan.planType === 'customized') && juicesLoaded && (
              <CategoryBasedSubscription
                selectedPlan={selectedPlan}
                juices={juices}
                onCategorySelect={handleCategorySelect}
                selectedCategory={selectedCategory}
                categoryJuices={categoryJuices}
              />
            )}

            {/* Juice Customization - only for juice-only and customized plans when no category is selected */}
            {selectedPlan.isCustomizable && (selectedPlan.planType === 'juice-only' || selectedPlan.planType === 'customized') && juicesLoaded && !selectedCategory && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary">Customize Your Juices</CardTitle>
                  {selectedPlan.maxJuices && (
                    <CardDescription>
                      Select individual juices from our complete collection (max {selectedPlan.maxJuices} per juice type). You have selected {Object.keys(customSelections).length} different types.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto p-4">
                  {juices.map(juice => (
                    <div key={juice.id} className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/20 transition-colors text-center">
                      <Image 
                        src={juice.image} 
                        alt={juice.name} 
                        width={80} 
                        height={80} 
                        className="rounded-lg object-contain shadow-md" 
                        data-ai-hint={juice.dataAiHint || juice.name.toLowerCase()}
                      />
                      <p className="font-medium text-sm mt-1">{juice.name}</p>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" // Slightly smaller buttons for vertical layout
                          onClick={() => handleQuantityChange(juice.id, (customSelections[juice.id] || 0) - 1)}
                          disabled={(customSelections[juice.id] || 0) === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number"
                          value={customSelections[juice.id] || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && selectedPlan?.maxJuices) {
                              handleQuantityChange(juice.id, Math.min(val, selectedPlan.maxJuices));
                            }
                          }}
                          className="w-12 h-8 text-center text-sm px-1" // Slightly smaller input
                          min="0"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" // Slightly smaller buttons
                          onClick={() => handleQuantityChange(juice.id, (customSelections[juice.id] || 0) + 1)}
                          disabled={(customSelections[juice.id] || 0) >= (selectedPlan?.maxJuices || 0)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>

              </Card>
            )}

            {/* Fruit Bowl Customization - only for fruit-bowl-only and customized plans */}
            {selectedPlan.isCustomizable && (selectedPlan.planType === 'fruit-bowl-only' || selectedPlan.planType === 'customized') && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-primary">Customize Your Fruit Bowls</CardTitle>
                  {selectedPlan.maxFruitBowls && (
                    <CardDescription>
                      Select up to {totalFruitBowlLimit} different fruit bowl types. You have selected {Object.keys(fruitBowlSelections).length} / {totalFruitBowlLimit} types.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto p-4">
                  {Array.isArray(fruitBowls) && fruitBowls.length > 0 ? fruitBowls.map((fruitBowl: FruitBowl) => (
                    <div key={fruitBowl.id} className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/20 transition-colors text-center">
                      <Image 
                        src={
                          (fruitBowl.image && fruitBowl.image.trim()) || 
                          (fruitBowl.image_url && fruitBowl.image_url.trim()) || 
                          '/images/fruit-bowl-custom.jpg'
                        } 
                        alt={fruitBowl.name} 
                        width={80} 
                        height={80} 
                        className="rounded-lg object-contain shadow-md" 
                        data-ai-hint={fruitBowl.dataAiHint || fruitBowl.name.toLowerCase()}
                      />
                      <p className="font-medium text-sm mt-1">{fruitBowl.name}</p>
                      <p className="text-xs text-muted-foreground">{fruitBowl.flavor}</p>
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleFruitBowlQuantityChange(fruitBowl.id, (fruitBowlSelections[fruitBowl.id] || 0) - 1)}
                          disabled={(fruitBowlSelections[fruitBowl.id] || 0) === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input 
                          type="number"
                          value={fruitBowlSelections[fruitBowl.id] || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && selectedPlan?.maxFruitBowls) {
                              handleFruitBowlQuantityChange(fruitBowl.id, Math.min(val, selectedPlan.maxFruitBowls));
                            }
                          }}
                          className="w-12 h-8 text-center text-sm px-1"
                          min="0"
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleFruitBowlQuantityChange(fruitBowl.id, (fruitBowlSelections[fruitBowl.id] || 0) + 1)}
                          disabled={(fruitBowlSelections[fruitBowl.id] || 0) >= (selectedPlan?.maxFruitBowls || 0)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No fruit bowls available</p>
                    </div>
                  )}
                </CardContent>

              </Card>
            )}
            
            <Separator />
            
            <div className="text-center p-4 border-dashed border-2 border-primary/50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
              <p className="text-muted-foreground mb-4">
                Confirm your selections and proceed to checkout.
              </p>              <Button 
                onClick={handleProceedToCheckout}
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={!selectedPricing}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> 
                {!selectedPricing ? 'Loading...' : 'Add to Cart'}
              </Button>
              {!selectedPricing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Calculating pricing...
                </p>
              )}
              {selectedPricing && (
                <p className="text-sm text-muted-foreground mt-2">
                  Total: ₹{selectedPricing.finalPrice?.toFixed(2)} 
                  {selectedPricing.discountAmount > 0 && (
                    <span className="text-green-600 ml-2">
                      (Save ₹{selectedPricing.discountAmount.toFixed(2)})
                    </span>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-lg mx-auto shadow-xl text-center animate-fade-in">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-destructive">Plan Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              The subscription plan you selected could not be found. Please try again or select another plan.
            </p>
            <Button asChild>
              <Link href="/subscriptions">View Subscription Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading plan details...</div>}>
      <SubscribePageContents />
    </Suspense>
  );
}


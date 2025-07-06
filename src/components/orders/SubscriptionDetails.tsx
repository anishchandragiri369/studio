"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Tag, 
  Package, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  Leaf,
  Star
} from 'lucide-react';
import Image from 'next/image';

interface SubscriptionDetailsProps {
  subscriptionInfo: any;
  orderType: string;
}

// Helper function to normalize subscription data from different structures
function normalizeSubscriptionData(subscriptionInfo: any) {
  if (!subscriptionInfo) return null;

  // Check if it's the new nested structure with subscriptionItems
  if (subscriptionInfo.subscriptionItems && Array.isArray(subscriptionInfo.subscriptionItems)) {
    // Extract data from the first subscription item (assuming single subscription per order for now)
    const firstItem = subscriptionInfo.subscriptionItems[0];
    const subData = firstItem?.subscriptionData || {};
    
    return {
      planName: subData.planName || firstItem?.name || 'Subscription Plan',
      planFrequency: subData.planFrequency || 'weekly',
      subscriptionDuration: subData.subscriptionDuration || 1,
      basePrice: subData.basePrice || firstItem?.price || 0,
      selectedCategory: subData.selectedCategory || null,
      selectedJuices: subData.selectedJuices || [],
      selectedFruitBowls: subData.selectedFruitBowls || [],
      categoryDistribution: subData.categoryDistribution || null,
      deliverySchedule: subscriptionInfo.deliverySchedule || null
    };
  }

  // Check if it's the old flat structure
  if (subscriptionInfo.planName || subscriptionInfo.planFrequency) {
    return {
      planName: subscriptionInfo.planName || 'Subscription Plan',
      planFrequency: subscriptionInfo.planFrequency || 'weekly',
      subscriptionDuration: subscriptionInfo.subscriptionDuration || 1,
      basePrice: subscriptionInfo.basePrice || 0,
      selectedCategory: subscriptionInfo.selectedCategory || null,
      selectedJuices: subscriptionInfo.selectedJuices || [],
      selectedFruitBowls: subscriptionInfo.selectedFruitBowls || [],
      categoryDistribution: subscriptionInfo.categoryDistribution || null,
      deliverySchedule: subscriptionInfo.deliverySchedule || null
    };
  }

  // If it's neither, return null
  return null;
}

export default function SubscriptionDetails({ subscriptionInfo, orderType }: SubscriptionDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [juices, setJuices] = useState<any[]>([]);
  const [fruitBowls, setFruitBowls] = useState<any[]>([]);
  const [normalizedData, setNormalizedData] = useState<any>(null);

  useEffect(() => {
    // Normalize the subscription data
    const normalized = normalizeSubscriptionData(subscriptionInfo);
    setNormalizedData(normalized);
  }, [subscriptionInfo]);

  useEffect(() => {
    const fetchData = async () => {
      if (!normalizedData) return;

      // Fetch juices for name resolution
      if (normalizedData.selectedJuices?.length > 0) {
        try {
          const response = await fetch('/api/juices');
          if (response.ok) {
            const data = await response.json();
            setJuices(data.juices || []);
          }
        } catch (error) {
          console.error('Failed to fetch juices:', error);
        }
      }

      // Fetch fruit bowls for name resolution
      if (normalizedData.selectedFruitBowls?.length > 0) {
        try {
          const response = await fetch('/api/fruit-bowls');
          if (response.ok) {
            const data = await response.json();
            setFruitBowls(data.fruitBowls || []);
          }
        } catch (error) {
          console.error('Failed to fetch fruit bowls:', error);
        }
      }
    };

    fetchData();
  }, [normalizedData]);

  if (!normalizedData || orderType !== 'subscription') {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getJuiceName = (juiceId: string) => {
    const juice = juices.find(j => j.id === juiceId || j.id.toString() === juiceId.toString());
    return juice ? juice.name : `Juice (ID: ${juiceId})`;
  };

  const getFruitBowlName = (bowlId: string) => {
    const bowl = fruitBowls.find(b => b.id === bowlId || b.id.toString() === bowlId.toString());
    return bowl ? bowl.name : `Fruit Bowl (ID: ${bowlId})`;
  };

  const isCategoryBased = normalizedData.selectedCategory && normalizedData.selectedCategory !== 'custom';
  const isCustomized = !isCategoryBased && normalizedData.selectedJuices?.length > 0;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Subscription Plan
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-blue-600">
            {normalizedData.planName}
          </Badge>
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            {normalizedData.planFrequency} delivery
          </Badge>
          {isCategoryBased && (
            <Badge variant="outline" className="border-green-300 text-green-700">
              <Tag className="h-3 w-3 mr-1" />
              {normalizedData.selectedCategory}
            </Badge>
          )}
          {isCustomized && (
            <Badge variant="outline" className="border-purple-300 text-purple-700">
              <Settings className="h-3 w-3 mr-1" />
              Customized
            </Badge>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <Separator className="bg-blue-200" />
          
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Plan Information
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{normalizedData.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="font-medium capitalize">{normalizedData.planFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{normalizedData.subscriptionDuration} cycles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-medium">{formatCurrency(normalizedData.basePrice)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                Selection Type
              </h4>
              <div className="space-y-2">
                {isCategoryBased ? (
                  <div className="text-sm">
                    <p className="font-medium text-green-700">Category-Based Selection</p>
                    <p className="text-muted-foreground">
                      Juices automatically distributed from the <strong>{normalizedData.selectedCategory}</strong> category
                    </p>
                    {normalizedData.categoryDistribution && (
                      <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs font-medium text-green-700 mb-1">Distribution Preview:</p>
                        <div className="text-xs text-green-600">
                          {normalizedData.categoryDistribution.map((dist: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>Day {dist.day}:</span>
                              <span>{dist.juiceName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isCustomized ? (
                  <div className="text-sm">
                    <p className="font-medium text-purple-700">Customized Selection</p>
                    <p className="text-muted-foreground">
                      Manually selected juices and fruit bowls
                    </p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Standard Plan</p>
                    <p className="text-muted-foreground">
                      Default plan configuration
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Items */}
          {(normalizedData.selectedJuices?.length > 0 || normalizedData.selectedFruitBowls?.length > 0) && (
            <>
              <Separator className="bg-blue-200" />
              
              {/* Selected Juices */}
              {normalizedData.selectedJuices?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Selected Juices ({normalizedData.selectedJuices.length})
                  </h4>
                  <div className="space-y-2">
                    {normalizedData.selectedJuices.map((juice: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded border">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getJuiceName(juice.juiceId)}</p>
                          <p className="text-xs text-muted-foreground">
                            Quantity: {juice.quantity} • {formatCurrency(juice.pricePerItem || 0)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency((juice.quantity || 0) * (juice.pricePerItem || 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Fruit Bowls */}
              {normalizedData.selectedFruitBowls?.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    Selected Fruit Bowls ({normalizedData.selectedFruitBowls.length})
                  </h4>
                  <div className="space-y-2">
                    {normalizedData.selectedFruitBowls.map((bowl: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded border">
                        <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                          <Star className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{getFruitBowlName(bowl.fruitBowlId)}</p>
                          <p className="text-xs text-muted-foreground">
                            Quantity: {bowl.quantity} • {formatCurrency(bowl.pricePerItem || 0)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency((bowl.quantity || 0) * (bowl.pricePerItem || 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Delivery Schedule */}
          {normalizedData.deliverySchedule && (
            <>
              <Separator className="bg-blue-200" />
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Delivery Schedule
                </h4>
                <div className="text-sm text-muted-foreground">
                  <p>Next delivery: {normalizedData.deliverySchedule.nextDelivery}</p>
                  <p>Frequency: {normalizedData.deliverySchedule.frequency}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
} 
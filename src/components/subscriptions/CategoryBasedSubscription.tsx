"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Info, Calendar, Package } from 'lucide-react';
import type { Juice, SubscriptionPlan } from '@/lib/types';
import { TRADITIONAL_JUICE_CATEGORIES, HOME_CATEGORIES } from '@/lib/constants';
import { 
  calculateCategoryDistribution, 
  getAvailableCategories, 
  getCategoryDescription,
  validateCategoryForSubscription,
  type CategoryDistribution 
} from '@/lib/categorySubscriptionHelper';
import Image from 'next/image';

interface CategoryBasedSubscriptionProps {
  selectedPlan: SubscriptionPlan;
  juices: Juice[];
  onCategorySelect: (category: string | null, categoryJuices: Juice[]) => void;
  selectedCategory: string | null;
  categoryJuices: Juice[];
}

export default function CategoryBasedSubscription({
  selectedPlan,
  juices,
  onCategorySelect,
  selectedCategory,
  categoryJuices
}: CategoryBasedSubscriptionProps) {
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [distributionPlan, setDistributionPlan] = useState<CategoryDistribution[]>([]);
  const [categoryValidation, setCategoryValidation] = useState<{ isValid: boolean; message: string; availableJuices: number } | null>(null);

  // Get all available categories from juices
  useEffect(() => {
    const categories = getAvailableCategories(juices);
    setAvailableCategories(categories);
  }, [juices]);

  // Calculate distribution when category or plan changes
  useEffect(() => {
    if (selectedCategory && categoryJuices.length > 0 && selectedPlan) {
      const plan = calculateCategoryDistribution(selectedCategory, categoryJuices, selectedPlan);
      setDistributionPlan(plan);
      
      // Validate the category
      const validation = validateCategoryForSubscription(selectedCategory, categoryJuices, selectedPlan);
      setCategoryValidation(validation);
    } else {
      setDistributionPlan([]);
      setCategoryValidation(null);
    }
  }, [selectedCategory, categoryJuices, selectedPlan]);



  const handleCategoryChange = (category: string) => {
    if (category === 'customized') {
      onCategorySelect(null, []);
    } else {
      const categoryJuices = juices.filter(juice => 
        juice.category === category || 
        (juice.tags && juice.tags.includes(category))
      );
      onCategorySelect(category, categoryJuices);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
          <Package className="h-5 w-5" />
          Choose Your Juice Category
        </CardTitle>
        <CardDescription>
          Select a category to get juices from that specific category throughout your subscription, 
          or choose "Customized" to select individual juices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Category:</label>
          <Select value={selectedCategory || 'customized'} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]" onCloseAutoFocus={(e) => e.preventDefault()}>
              <SelectItem value="customized">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Customized Selection
                </div>
              </SelectItem>
              {availableCategories.map(category => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {juices.filter(juice => 
                        juice.category === category || 
                        (juice.tags && juice.tags.includes(category))
                      ).length} juices
                    </Badge>
                    {category}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Description */}
        {selectedCategory && (
          <div className={`p-3 border rounded-lg ${
            categoryValidation?.isValid 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-start gap-2">
              <Info className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                categoryValidation?.isValid ? 'text-blue-600' : 'text-orange-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  categoryValidation?.isValid ? 'text-blue-900' : 'text-orange-900'
                }`}>
                  {getCategoryDescription(selectedCategory)}
                </p>
                <p className={`text-xs mt-1 ${
                  categoryValidation?.isValid ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  {categoryValidation?.message}
                </p>
                {categoryValidation?.isValid && (
                  <p className="text-xs text-blue-700 mt-1">
                    You'll receive {selectedPlan.maxJuices} juices from this category distributed across your {selectedPlan.frequency} subscription.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Distribution Preview */}
        {selectedCategory && distributionPlan.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Your {selectedCategory} Distribution Plan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {distributionPlan.map((item) => (
                <div key={item.juiceId} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Image 
                    src={item.juice.image} 
                    alt={item.juice.name} 
                    width={40} 
                    height={40} 
                    className="rounded object-contain" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.juice.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} bottles • Days {item.days.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              <strong>Note:</strong> This distribution ensures you get variety throughout your subscription period. 
              Actual delivery schedule will be based on your chosen delivery frequency.
            </div>
          </div>
        )}

        {/* Customized Option Info */}
        {!selectedCategory && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Customized Selection Mode
                </p>
                <p className="text-xs text-green-700 mt-1">
                  You can now select individual juices from our complete collection below.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
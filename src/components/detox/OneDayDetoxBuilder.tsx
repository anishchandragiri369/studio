'use client';

import { useState } from 'react';
import { JUICES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface OneDayDetoxBuilderProps {
  onClose?: () => void;
}

export default function OneDayDetoxBuilder({ onClose }: OneDayDetoxBuilderProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedJuices, setSelectedJuices] = useState<{ [key: string]: number }>({});
  const [selectedFruitBowls, setSelectedFruitBowls] = useState<{ [key: string]: number }>({});

  // Get available juices (excluding detox plans and fruit bowls)
  const availableJuices = JUICES.filter(juice => 
    juice.category !== 'Detox Plans' && 
    juice.category !== 'Fruit Bowls' &&
    juice.availability !== 'Out of Stock'
  );

  // Get available fruit bowls
  const availableFruitBowls = JUICES.filter(juice => 
    juice.category === 'Fruit Bowls' &&
    juice.availability !== 'Out of Stock'
  );

  const selectedJuiceCount = Object.values(selectedJuices).reduce((sum, count) => sum + count, 0);
  const selectedFruitBowlCount = Object.values(selectedFruitBowls).reduce((sum, count) => sum + count, 0);

  const isValidSelection = selectedJuiceCount >= 5 && selectedFruitBowlCount >= 2;

  const calculateTotalPrice = () => {
    let total = 0;
    
    // Add juice prices
    Object.entries(selectedJuices).forEach(([juiceId, quantity]) => {
      const juice = availableJuices.find(j => j.id === juiceId);
      if (juice) {
        total += juice.price * quantity;
      }
    });

    // Add fruit bowl prices
    Object.entries(selectedFruitBowls).forEach(([bowlId, quantity]) => {
      const bowl = availableFruitBowls.find(b => b.id === bowlId);
      if (bowl) {
        total += bowl.price * quantity;
      }
    });

    return total;
  };

  const handleJuiceQuantityChange = (juiceId: string, change: number) => {
    setSelectedJuices(prev => {
      const currentTotal = Object.values(prev).reduce((sum, count) => sum + count, 0);
      const currentJuiceCount = prev[juiceId] || 0;
      const newQuantity = currentJuiceCount + change;
      // Prevent going below 0
      if (newQuantity <= 0) {
        const { [juiceId]: removed, ...rest } = prev;
        return rest;
      }
      // Prevent exceeding 1 of a single juice
      if (newQuantity > 1) return prev;
      // Prevent exceeding 5 juices in total
      if (change > 0 && currentTotal >= 5) return prev;
      return { ...prev, [juiceId]: newQuantity };
    });
  };

  const handleFruitBowlQuantityChange = (bowlId: string, change: number) => {
    setSelectedFruitBowls(prev => {
      const newQuantity = (prev[bowlId] || 0) + change;
      if (newQuantity <= 0) {
        const { [bowlId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [bowlId]: Math.min(newQuantity, 2) }; // Max 2 of each fruit bowl
    });
  };
  const handleAddToCart = () => {
    if (!isValidSelection) {
      toast({
        title: "Selection Required",
        description: "Please select at least 5 juices and 2 fruit bowls",
        variant: "destructive"
      });
      return;
    }

    // Create a custom detox plan object
    const detoxPlan = {
      id: `custom-detox-${Date.now()}`,
      name: '1-Day Custom Detox Plan',
      flavor: 'Your Custom Selection',
      price: calculateTotalPrice(),
      image: '/images/juice-7.jpeg',
      description: `Your personalized 1-day detox with ${selectedJuiceCount} juices and ${selectedFruitBowlCount} fruit bowls`,
      category: 'Custom Detox Plan',
      tags: ['custom', '1-day detox', 'personalized'],
      availability: 'In Stock' as const,
      stockQuantity: 1,
    };

    addToCart(detoxPlan, 1);
    
    toast({
      title: "Added to Cart!",
      description: "1-Day Custom Detox Plan added to cart successfully",
    });
    
    if (onClose) {
      onClose();
    }
  };
  return (
    <div className="max-w-6xl mx-auto p-4 pb-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-headline font-bold mb-4">Build Your 1-Day Detox Plan</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
          Create your perfect detox day by selecting at least 5 juices and 2 fruit bowls. 
          Mix and match to suit your taste preferences and health goals.
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Badge variant={selectedJuiceCount >= 5 ? "default" : "secondary"} className="flex items-center gap-1 text-xs">
            {selectedJuiceCount >= 5 && <Check className="w-3 h-3" />}
            Juices: {selectedJuiceCount}/5+ selected
          </Badge>
          <Badge variant={selectedFruitBowlCount >= 2 ? "default" : "secondary"} className="flex items-center gap-1 text-xs">
            {selectedFruitBowlCount >= 2 && <Check className="w-3 h-3" />}
            Fruit Bowls: {selectedFruitBowlCount}/2+ selected
          </Badge>
        </div>
      </div>{/* Juices Selection */}
      <section className="mb-12">
        <h3 className="text-2xl font-semibold mb-6">Choose Your Juices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableJuices.map(juice => (
            <Card key={juice.id} className="overflow-hidden h-fit">
              <div className="relative h-40 w-full bg-white flex items-center justify-center">
                <Image
                  src={juice.image}
                  alt={juice.name}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {juice.availability === 'Low Stock' && (
                  <Badge className="absolute top-2 right-2" variant="destructive">
                    Low Stock
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-base font-semibold truncate">{juice.name}</CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2">{juice.flavor}</p>
                <p className="font-semibold text-primary text-sm">₹{juice.price.toFixed(2)}</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJuiceQuantityChange(juice.id, -1)}
                      disabled={!selectedJuices[juice.id]}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{selectedJuices[juice.id] || 0}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJuiceQuantityChange(juice.id, 1)}
                      disabled={selectedJuices[juice.id] >= 1 || (selectedJuiceCount >= 5)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>      {/* Fruit Bowls Selection */}
      <section className="mb-8">
        <h3 className="text-2xl font-semibold mb-6">Choose Your Fruit Bowls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableFruitBowls.map(bowl => (
            <Card key={bowl.id} className="overflow-hidden h-fit">
              <div className="relative h-40 w-full bg-white flex items-center justify-center">
                <Image
                  src={bowl.image}
                  alt={bowl.name}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {bowl.availability === 'Low Stock' && (
                  <Badge className="absolute top-2 right-2" variant="destructive">
                    Low Stock
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-base font-semibold truncate">{bowl.name}</CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2">{bowl.flavor}</p>
                <p className="font-semibold text-primary text-sm">₹{bowl.price.toFixed(2)}</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFruitBowlQuantityChange(bowl.id, -1)}
                      disabled={!selectedFruitBowls[bowl.id]}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{selectedFruitBowls[bowl.id] || 0}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFruitBowlQuantityChange(bowl.id, 1)}
                      disabled={selectedFruitBowls[bowl.id] >= 2}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>      {/* Summary and Add to Cart */}
      <div className="mt-8 pt-4 border-t border-border">
        <Card className="bg-background/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-semibold">Your Custom 1-Day Detox Plan</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedJuiceCount} juices • {selectedFruitBowlCount} fruit bowls
                </p>
                <p className="text-xl font-bold text-primary">₹{calculateTotalPrice().toFixed(2)}</p>
              </div>
              
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!isValidSelection}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 w-full sm:w-auto"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
            
            {!isValidSelection && (
              <div className="text-center mt-3 p-2 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {selectedJuiceCount < 5 && `Select ${5 - selectedJuiceCount} more juice${5 - selectedJuiceCount !== 1 ? 's' : ''}`}
                  {selectedJuiceCount < 5 && selectedFruitBowlCount < 2 && ' and '}
                  {selectedFruitBowlCount < 2 && `${2 - selectedFruitBowlCount} more fruit bowl${2 - selectedFruitBowlCount !== 1 ? 's' : ''}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

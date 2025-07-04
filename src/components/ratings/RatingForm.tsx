"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Loader2, ThumbsUp, Truck, Coffee, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Order {
  id: string;
  items: Array<{
    juiceId?: string;
    juiceName?: string;
    quantity?: number;
    pricePerItem?: number;
  }>;
  total_amount: number;
  status: string;
  created_at: string;
}

interface RatingFormProps {
  order: Order;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ProductRating {
  juiceId: string;
  juiceName: string;
  rating: number;
  tasteRating?: number;
  freshnessRating?: number;
  feedbackText?: string;
  wouldRecommend?: boolean;
}

export default function RatingForm({ order, userId, onSuccess, onCancel }: RatingFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Overall order rating
  const [overallRating, setOverallRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  
  // Product ratings
  const [productRatings, setProductRatings] = useState<{ [key: string]: ProductRating }>({});
  const [showProductRatings, setShowProductRatings] = useState(false);

  const starCategories = [
    { key: 'overall', label: 'Overall Experience', value: overallRating, setter: setOverallRating, icon: Star, required: true },
    { key: 'quality', label: 'Product Quality', value: qualityRating, setter: setQualityRating, icon: Coffee },
    { key: 'delivery', label: 'Delivery Experience', value: deliveryRating, setter: setDeliveryRating, icon: Truck },
    { key: 'service', label: 'Customer Service', value: serviceRating, setter: setServiceRating, icon: ThumbsUp },
  ];

  const renderStarRating = (rating: number, setRating: (rating: number) => void, size: string = 'w-6 h-6') => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`${size} transition-colors ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const updateProductRating = (juiceId: string, field: keyof ProductRating, value: any) => {
    setProductRatings(prev => ({
      ...prev,
      [juiceId]: {
        ...prev[juiceId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const productRatingsList = Object.values(productRatings).filter(rating => rating.rating > 0);

      // Use direct fetch to the API endpoint with relative URL to ensure proper routing
      console.log("Submitting rating for order:", order.id);
      
      // Create the request payload
      const payload = {
        orderId: order.id,
        userId,
        rating: overallRating,
        qualityRating: qualityRating ?? null,
        deliveryRating: deliveryRating ?? null,
        serviceRating: serviceRating ?? null,
        feedbackText: feedbackText.trim() || null,
        anonymous,
        productRatings: productRatingsList
      };
      
      console.log("Rating payload:", payload);
      
      const response = await fetch('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log("Rating submission response status:", response.status);
      const result = await response.json();
      console.log("Rating submission response:", result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit rating');
      }

      toast({
        title: "Rating Submitted!",
        description: result.message || "Thank you for your feedback!",
      });

      // Emit event to refresh rewards display
      window.dispatchEvent(new CustomEvent('ratingSubmitted', {
        detail: { orderId: order.id, pointsEarned: result.data?.pointsEarned || 0 }
      }));

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Rate Your Order
        </CardTitle>
        <CardDescription>
          Order #{order.id.slice(-8)} • ₹{order.total_amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Rating Categories */}
        <div className="space-y-4">
          {starCategories.map((category) => (
            <div key={category.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <category.icon className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">
                  {category.label} {category.required && <span className="text-red-500">*</span>}
                </Label>
              </div>
              {renderStarRating(category.value, category.setter)}
            </div>
          ))}
        </div>

        <Separator />

        {/* Feedback Text */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Additional Comments (Optional)</Label>
          <Textarea
            id="feedback"
            placeholder="Tell us about your experience. What did you love? What could we improve?"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="min-h-[100px]"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">
            {feedbackText.length}/1000 characters
          </p>
        </div>

        {/* Product Ratings Section */}
        {order.items && order.items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rate Individual Products</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowProductRatings(!showProductRatings)}
              >
                {showProductRatings ? 'Hide' : 'Show'} Product Ratings
              </Button>
            </div>
            
            {showProductRatings && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                {order.items.map((item, index) => {
                  const juiceId = item.juiceId || `item-${index}`;
                  const juiceName = item.juiceName || 'Unknown Product';
                  const productRating = productRatings[juiceId] || {};
                  
                  return (
                    <div key={juiceId} className="space-y-3 p-3 bg-background rounded border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{juiceName}</h4>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                        </div>
                        {renderStarRating(
                          productRating.rating || 0,
                          (rating) => updateProductRating(juiceId, 'rating', rating),
                          'w-5 h-5'
                        )}
                      </div>
                      
                      {productRating.rating > 0 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Taste</Label>
                              {renderStarRating(
                                productRating.tasteRating || 0,
                                (rating) => updateProductRating(juiceId, 'tasteRating', rating),
                                'w-4 h-4'
                              )}
                            </div>
                            <div>
                              <Label className="text-xs">Freshness</Label>
                              {renderStarRating(
                                productRating.freshnessRating || 0,
                                (rating) => updateProductRating(juiceId, 'freshnessRating', rating),
                                'w-4 h-4'
                              )}
                            </div>
                          </div>
                          
                          <Textarea
                            placeholder="Comments about this product..."
                            value={productRating.feedbackText || ''}
                            onChange={(e) => updateProductRating(juiceId, 'feedbackText', e.target.value)}
                            className="min-h-[60px]"
                          />
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`recommend-${juiceId}`}
                              checked={productRating.wouldRecommend || false}
                              onCheckedChange={(checked) => 
                                updateProductRating(juiceId, 'wouldRecommend', checked)
                              }
                            />
                            <Label htmlFor={`recommend-${juiceId}`} className="text-sm">
                              Would recommend this product
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Anonymous Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={anonymous}
            onCheckedChange={(checked) => setAnonymous(checked as boolean)}
          />
          <Label htmlFor="anonymous" className="text-sm">
            Submit anonymously
          </Label>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || overallRating === 0}
            className="flex-1"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Rating & Earn 5 Points
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

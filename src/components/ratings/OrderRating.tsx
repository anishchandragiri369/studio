"use client";

import { useState, useEffect } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import RatingForm from './RatingForm';

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
  rating_submitted?: boolean;
}

interface OrderRatingProps {
  order: Order;
  userId?: string;
  compact?: boolean;
  showForm?: boolean;
}

export default function OrderRating({ order, userId, compact = false, showForm = true }: OrderRatingProps) {
  const [existingRating, setExistingRating] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const isEligibleForRating = () => {
    const completedStatuses = ['delivered', 'Delivered', 'payment_success', 'Payment Success', 'completed'];
    return completedStatuses.includes(order.status) && !order.rating_submitted && !existingRating;
  };

  // Check for existing rating on component mount
  useEffect(() => {
    if (userId) {
      // If rating_submitted is already true, we can trust it
      // However, we should still fetch the existing rating to display it
      fetchExistingRating();
    }
  }, [userId, order.id]);
  
  // Make sure we have consistent state between order.rating_submitted and existingRating
  useEffect(() => {
    if (existingRating) {
      // Use direct assignment instead of nullish assignment to avoid lint error
      order.rating_submitted = true;
    }
  }, [existingRating, order]);

  const fetchExistingRating = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log(`Checking if order ${order.id} has an existing rating`);
      const response = await fetch(`/api/ratings/submit?orderId=${order.id}&userId=${userId}`);
      const result = await response.json();
      
      if (response.ok && result.data.orderRating) {
        console.log(`Found existing rating for order ${order.id}:`, result.data.orderRating);
        setExistingRating(result.data.orderRating);
        
        // If we find a rating but order.rating_submitted is false, update local state
        if (!order.rating_submitted) {
          order.rating_submitted = true;
        }
      } else {
        console.log(`No existing rating found for order ${order.id}`);
      }
    } catch (error) {
      console.error('Error fetching existing rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    
    // Mark order as rated in local state
    order.rating_submitted = true;
    
    // Refetch the rating to get the complete data
    fetchExistingRating();
    
    // Update any related UI
    setTimeout(() => {
      // Force a re-render of the component
      setLoading(true);
      setTimeout(() => setLoading(false), 10);
    }, 100);
    
    console.log(`Rating submission successful for order ${order.id}, updating local state`);
  };

  // Compact view - just stars or rating prompt
  if (compact) {
    if (existingRating) {
      return (
        <div className="flex items-center gap-2">
          {renderStars(existingRating.rating, 'w-3 h-3')}
          <span className="text-xs text-muted-foreground">
            Rated {existingRating.rating}/5
          </span>
        </div>
      );
    }

    if (isEligibleForRating() && showForm && userId) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-xs text-primary hover:text-primary/80"
          onClick={() => setShowRatingForm(true)}
        >
          <Star className="w-3 h-3 mr-1" />
          Rate Order
        </Button>
      );
    }

    return null;
  }

  // Full view with rating form dialog
  return (
    <div className="space-y-2">
      {existingRating ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {renderStars(existingRating.rating)}
            <span className="text-sm font-medium">Your Rating: {existingRating.rating}/5</span>
          </div>
          
          {existingRating.feedback_text && (
            <div className="bg-muted/30 p-2 rounded text-sm">
              <p>"{existingRating.feedback_text}"</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Thank you for your feedback!
          </div>
        </div>
      ) : isEligibleForRating() && showForm && userId ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            How was your experience with this order?
          </p>
          
          <Dialog open={showRatingForm} onOpenChange={setShowRatingForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Star className="w-4 h-4 mr-2" />
                Rate This Order & Earn 5 Points
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Rate Your Order</DialogTitle>
                <DialogDescription>
                  Share your experience and help us improve our service.
                </DialogDescription>
              </DialogHeader>
              <RatingForm
                order={order}
                userId={userId}
                onSuccess={handleRatingSuccess}
                onCancel={() => setShowRatingForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {order.status === 'payment_pending' || order.status === 'Payment Pending' 
            ? 'Rating will be available after delivery'
            : 'Rating not available'
          }
        </div>
      )}
    </div>
  );
}

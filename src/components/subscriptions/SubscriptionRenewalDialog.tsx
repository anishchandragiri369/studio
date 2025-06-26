"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Crown, Loader2 } from 'lucide-react';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import SubscriptionDurationSelector from './SubscriptionDurationSelector';
import type { UserSubscription } from '@/lib/types';

interface SubscriptionRenewalDialogProps {
  subscription: UserSubscription;
  basePrice: number;
  onRenewal: () => void;
  children: React.ReactNode;
}

export default function SubscriptionRenewalDialog({ 
  subscription, 
  basePrice, 
  onRenewal, 
  children 
}: SubscriptionRenewalDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);  const [selectedDuration, setSelectedDuration] = useState<1 | 2 | 3 | 4 | 6 | 12 | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<any>(null);

  const handleDurationSelect = (duration: 1 | 2 | 3 | 4 | 6 | 12, pricing: any) => {
    setSelectedDuration(duration);
    setSelectedPricing(pricing);
  };

  const handleRenewal = async () => {
    if (!selectedDuration || !selectedPricing) {
      toast({
        title: "Please select a duration",
        description: "Choose a subscription duration to continue with renewal.",
        variant: "destructive",
      });
      return;
    }

    setIsRenewing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/subscriptions/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },        body: JSON.stringify({
          subscriptionId: subscription.id,
          durationMonths: selectedDuration,
          basePrice: basePrice,
          frequency: subscription.delivery_frequency
        }),
      });

      const result = await response.json();      if (result.success) {
        const durationText = subscription.delivery_frequency === 'weekly' 
          ? (selectedDuration === 1 ? '1 week' : `${selectedDuration} weeks`)
          : (selectedDuration === 12 ? '1 year' : `${selectedDuration} months`);
        
        toast({
          title: "Subscription Renewed!",
          description: `Your subscription has been renewed for ${durationText}. Your next delivery is scheduled for ${new Date(result.data.nextDeliveryDate).toLocaleDateString()}.`,
          variant: "default",
        });
        setIsOpen(false);
        setSelectedDuration(null);
        setSelectedPricing(null);
        onRenewal();
      } else {
        toast({
          title: "Renewal Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while renewing your subscription.",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Renew Your Subscription
          </DialogTitle>
          <DialogDescription>
            Your subscription is expiring soon. Choose a new duration to continue enjoying your juice deliveries.
            {subscription.subscription_end_date && (
              <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-800">
                Current subscription expires on: {new Date(subscription.subscription_end_date).toLocaleDateString()}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>        <div className="py-4">
          <SubscriptionDurationSelector
            basePrice={basePrice}
            frequency={subscription.delivery_frequency}
            selectedDuration={selectedDuration || undefined}
            onDurationSelect={handleDurationSelect}
          />
        </div>

        {selectedPricing && (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">Renewal Summary</h3>            <div className="space-y-2 text-sm">              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium">
                  {subscription.delivery_frequency === 'weekly' 
                    ? (selectedDuration === 1 ? '1 Week' : `${selectedDuration} Weeks`)
                    : (selectedDuration === 12 ? '1 Year' : 
                       selectedDuration === 1 ? '1 Month' : 
                       `${selectedDuration} Months`)
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>{subscription.delivery_frequency === 'weekly' ? 'Weekly' : 'Monthly'} Rate:</span>
                <span>₹{basePrice.toFixed(2)}</span>
              </div>
              {selectedPricing.discountPercentage > 0 && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="line-through">₹{selectedPricing.originalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({selectedPricing.discountPercentage}%):</span>
                    <span>-₹{selectedPricing.discountAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{selectedPricing.finalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isRenewing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRenewal}
            disabled={!selectedDuration || isRenewing}
            className="bg-primary hover:bg-primary/90"
          >
            {isRenewing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew Subscription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Pause, Play, AlertTriangle, CheckCircle, Package, Crown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import SubscriptionRenewalDialog from './SubscriptionRenewalDialog';
import DeliverySchedule from './DeliverySchedule';
import type { UserSubscription } from '@/lib/types';

interface SubscriptionCardProps {
  subscription: UserSubscription;
  onUpdate: () => void;
  basePrice?: number; // Monthly base price for renewal calculations
}

export default function SubscriptionCard({ subscription, onUpdate, basePrice = 120 }: SubscriptionCardProps) {
  const { toast } = useToast();  const [isPausing, setIsPausing] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [showDeliverySchedule, setShowDeliverySchedule] = useState(false);

  const canPause = subscription.status === 'active' && 
    SubscriptionManager.canPauseSubscription(subscription.next_delivery_date).canPause;
  
  const canReactivate = subscription.status === 'paused' && 
    subscription.pause_date && 
    SubscriptionManager.canReactivateSubscription(subscription.pause_date).canReactivate;

  const reactivationInfo = subscription.pause_date ? 
    SubscriptionManager.canReactivateSubscription(subscription.pause_date) : null;

  // Check for renewal notification
  const renewalInfo = subscription.subscription_end_date ? 
    SubscriptionManager.getSubscriptionExpiryStatus(subscription.subscription_end_date) : null;

  const needsRenewal = renewalInfo && renewalInfo.status === 'expiring_soon';

  const handlePauseSubscription = async () => {
    if (!canPause) {
      const pauseCheck = SubscriptionManager.canPauseSubscription(subscription.next_delivery_date);
      toast({
        title: "Cannot Pause Subscription",
        description: pauseCheck.reason,
        variant: "destructive",
      });
      return;
    }

    setIsPausing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/subscriptions/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason: pauseReason.trim() || 'User requested pause'
        }),
      });

      const result = await response.json();      if (result.success) {
        toast({
          title: "Subscription Paused",
          description: `Your subscription has been paused. You can reactivate it until ${result.data.canReactivateUntil}. A confirmation email has been sent.`,
          variant: "default",
        });
        setShowPauseDialog(false);
        setPauseReason('');
        onUpdate();
      } else {
        toast({
          title: "Failed to Pause Subscription",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while pausing your subscription.",
        variant: "destructive",
      });
    } finally {
      setIsPausing(false);
    }
  };
  const handleReactivateSubscription = async () => {
    if (!canReactivate) {
      toast({
        title: "Cannot Reactivate Subscription",
        description: reactivationInfo?.reason || "Subscription cannot be reactivated.",
        variant: "destructive",
      });
      return;
    }

    setIsReactivating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/subscriptions/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id
        }),
      });

      const result = await response.json();      if (result.success) {
        const pauseDays = result.data.pauseDurationDays || 0;
        const extendedMessage = pauseDays > 0 
          ? ` Your subscription has been extended by ${pauseDays} day${pauseDays > 1 ? 's' : ''} to account for the pause period.`
          : '';
          toast({
          title: "Subscription Reactivated",
          description: `Your subscription is now active. Next delivery: ${result.data.nextDeliveryFormatted}.${extendedMessage} A confirmation email has been sent.`,
          variant: "default",
        });
        setShowReactivateDialog(false);
        onUpdate();
      } else {
        toast({
          title: "Failed to Reactivate Subscription",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while reactivating your subscription.",
        variant: "destructive",
      });
    } finally {
      setIsReactivating(false);
    }  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700">Paused</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {subscription.plan_id} Subscription
            </CardTitle>
            <CardDescription>
              {subscription.delivery_frequency} delivery • Rs.{subscription.total_amount}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Subscription Duration and Pricing Info */}
        {subscription.subscription_duration && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {subscription.subscription_duration === 12 ? '1 Year' : `${subscription.subscription_duration} Months`} Plan
                </span>
                {subscription.discount_percentage > 0 && (
                  <Badge className="bg-green-100 text-green-700">
                    {subscription.discount_percentage}% OFF
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{subscription.final_price || subscription.total_amount}</div>
                {subscription.discount_amount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Saved ₹{subscription.discount_amount}
                  </div>
                )}
              </div>
            </div>
            
            {subscription.subscription_end_date && (
              <div className="text-xs text-muted-foreground">
                {subscription.status === 'active' ? 'Expires' : 'Expired'}: {SubscriptionManager.formatDate(subscription.subscription_end_date)}
                {renewalInfo && renewalInfo.status === 'active' && (
                  <span className="ml-2">({renewalInfo.daysLeft} days left)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Renewal Notification */}
        {needsRenewal && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Subscription Expiring Soon!</AlertTitle>            <AlertDescription className="text-amber-700">
              {renewalInfo?.message}
              <div className="mt-2">
                <SubscriptionRenewalDialog
                  subscription={subscription}
                  basePrice={basePrice}
                  onRenewal={onUpdate}
                >
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renew Subscription
                  </Button>
                </SubscriptionRenewalDialog>
              </div>
            </AlertDescription>
          </Alert>
        )}        {subscription.status === 'active' && (
          <div className="space-y-2">            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>Next delivery: {SubscriptionManager.formatDate(subscription.next_delivery_date)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/subscriptions/regenerate-schedule`, {
                      method: 'POST'
                    });
                    const result = await response.json();
                    if (result.success) {
                      toast({
                        title: "Schedule Regenerated",
                        description: `Updated ${result.data.processedCount} subscriptions with daily deliveries`,
                        variant: "default",
                      });
                      onUpdate();
                    }
                  } catch (error) {
                    console.error('Error regenerating schedule:', error);
                  }
                }}
                className="text-xs"
              >
                Regen Daily
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {SubscriptionManager.getTimeUntilDelivery(subscription.next_delivery_date)} until next delivery
              </span>
            </div>

            {/* Toggle to show full delivery schedule */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeliverySchedule(!showDeliverySchedule)}
              className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
            >
              {showDeliverySchedule ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide schedule
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  View delivery schedule
                </>
              )}
            </Button>

            {/* Full delivery schedule */}
            {showDeliverySchedule && (
              <div className="mt-3 pt-3 border-t">
                <DeliverySchedule subscriptionId={subscription.id} />
              </div>
            )}
          </div>
        )}

        {/* {subscription.status === 'active' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {SubscriptionManager.getTimeUntilDelivery(subscription.next_delivery_date)} until next delivery
            </span>
          </div>
        )} */}

        {subscription.status === 'paused' && subscription.pause_date && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Subscription Paused</AlertTitle>
            <AlertDescription>
              Paused on {SubscriptionManager.formatDate(subscription.pause_date)}
              {subscription.pause_reason && ` • Reason: ${subscription.pause_reason}`}
              <br />
              {reactivationInfo && reactivationInfo.canReactivate ? (
                <>You can reactivate this subscription for {reactivationInfo.daysLeft} more days.</>
              ) : (
                <>This subscription has expired and cannot be reactivated.</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {subscription.status === 'expired' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Subscription Expired</AlertTitle>
            <AlertDescription>
              This subscription expired and can no longer be reactivated. Please create a new subscription.
            </AlertDescription>
          </Alert>
        )}        {needsRenewal && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Renewal Reminder</AlertTitle>            <AlertDescription>
              {renewalInfo?.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {subscription.status === 'active' && (
          <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!canPause}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pause Subscription</DialogTitle>
                <DialogDescription>
                  You can pause your subscription with 24 hours notice before the next delivery.
                  You'll be able to reactivate it within 3 months.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pause-reason">Reason for pausing (optional)</Label>
                  <Textarea
                    id="pause-reason"
                    placeholder="e.g., Going on vacation, temporary financial constraints..."
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    className="mt-2"
                  />
                </div>
                {!canPause && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {SubscriptionManager.canPauseSubscription(subscription.next_delivery_date).reason}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPauseDialog(false)}
                  disabled={isPausing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePauseSubscription}
                  disabled={isPausing || !canPause}
                >
                  {isPausing ? 'Pausing...' : 'Pause Subscription'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {subscription.status === 'paused' && (
          <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                disabled={!canReactivate}
              >
                <Play className="h-4 w-4 mr-2" />
                Reactivate Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reactivate Subscription</DialogTitle>
                <DialogDescription>
                  Your subscription will be reactivated and deliveries will resume.
                  The next delivery will be scheduled at least 24 hours from now.
                </DialogDescription>
              </DialogHeader>
              {!canReactivate && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {reactivationInfo?.reason || "This subscription cannot be reactivated."}
                  </AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowReactivateDialog(false)}
                  disabled={isReactivating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleReactivateSubscription}
                  disabled={isReactivating || !canReactivate}
                >
                  {isReactivating ? 'Reactivating...' : 'Reactivate Subscription'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}

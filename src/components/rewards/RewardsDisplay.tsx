"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Users, Copy, Check, Star, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { REWARD_CONFIG, convertPointsToAmount, canRedeemPoints } from '@/lib/rewards';

interface UserRewards {
  userId: string;
  totalPoints: number;
  totalEarned: number;
  referralCode: string;
  referralsCount: number;
  lastUpdated: string;
}

interface RewardsDisplayProps {
  userId: string;
}

export default function RewardsDisplay({ userId }: RewardsDisplayProps) {
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserRewards();
    }
  }, [userId]);

  const fetchUserRewards = async () => {
    try {
      setLoading(true);
      
      // Initialize rewards if needed
      await fetch('/api/rewards/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      // Fetch current rewards
      const response = await fetch(`/api/rewards/user/${userId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setRewards(result.data);
      }
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      toast({
        title: 'Error',
        description: 'Unable to load rewards information.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (rewards?.referralCode) {
      try {
        await navigator.clipboard.writeText(rewards.referralCode);
        setCopied(true);
        toast({
          title: 'Copied!',
          description: 'Referral code copied to clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Unable to copy referral code.',
          variant: 'destructive'
        });
      }
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-0 shadow-glass-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Rewards & Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rewards) {
    return null;
  }

  const redeemableAmount = convertPointsToAmount(rewards.totalPoints);
  const canRedeem = canRedeemPoints(rewards.totalPoints);

  return (
    <Card className="glass-card border-0 shadow-glass-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 gradient-text">
          <Gift className="h-5 w-5 text-primary" />
          Rewards & Referrals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reward Points */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Reward Points</span>
            </div>
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
              {rewards.totalPoints} points
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Worth ₹{redeemableAmount.toFixed(2)} • Minimum redemption: {REWARD_CONFIG.MIN_REDEMPTION_POINTS} points</p>
          </div>
          
          {canRedeem && (
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Redeem ₹{redeemableAmount.toFixed(2)}
            </Button>
          )}
        </div>

        <Separator />

        {/* Referral Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Your Referral Code</span>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              {rewards.referralsCount} referrals
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 p-3 glass rounded-lg border border-border/50">
              <div className="font-mono text-lg font-bold text-center">
                {rewards.referralCode}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyReferralCode}
              className="glass border-blue-500/50 text-blue-600 hover:bg-blue-50"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Share this code with friends! You'll earn ₹{REWARD_CONFIG.REFERRAL_REWARD_AMOUNT} + {REWARD_CONFIG.REFERRAL_REWARD_POINTS} points when they make their first order.</p>
          </div>
        </div>

        <Separator />

        {/* Earnings Summary */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              ₹{rewards.totalEarned.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Earned</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {rewards.referralsCount}
            </div>
            <div className="text-sm text-muted-foreground">Friends Referred</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

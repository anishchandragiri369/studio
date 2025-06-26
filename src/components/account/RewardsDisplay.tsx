"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Gift, 
  Users, 
  Copy, 
  Star, 
  TrendingUp, 
  Coins, 
  Calendar,
  ExternalLink,
  Loader2,
  Check,
  Share2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { REWARD_CONFIG, convertPointsToAmount, canRedeemPoints } from '@/lib/rewards';

interface UserRewards {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  totalEarned: number;
  referralCode: string;
  referralsCount: number;
  lastUpdated: string;
}

interface RewardTransaction {
  id: string;
  type: 'earned' | 'redeemed';
  points: number;
  amount: number;
  description: string;
  createdAt: string;
  orderId?: string;
}

export default function RewardsDisplay() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserRewards();
      fetchRewardTransactions();
    }
  }, [user]);

  const fetchUserRewards = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/rewards/user/${user.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setRewards(result.data);
      }
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      toast({
        title: "Error",
        description: "Unable to load your rewards. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardTransactions = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/rewards/transactions/${user.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching reward transactions:', error);
    }
  };

  const copyReferralCode = async () => {
    if (!rewards?.referralCode) return;

    try {
      await navigator.clipboard.writeText(rewards.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to copy referral code",
        variant: "destructive"
      });
    }
  };

  const shareReferralCode = async () => {
    if (!rewards?.referralCode) return;

    const shareData = {
      title: 'Join World of Elixrs!',
      text: `Use my referral code ${rewards.referralCode} and get amazing discounts on fresh juices!`,
      url: `${window.location.origin}?ref=${rewards.referralCode}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const redeemPoints = async (pointsToRedeem: number) => {
    if (!user?.id || !rewards) return;

    setRedeemLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/rewards/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          points: pointsToRedeem
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success!",
          description: `₹${convertPointsToAmount(pointsToRedeem)} has been added to your account`,
        });
        fetchUserRewards();
        fetchRewardTransactions();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to redeem points",
        variant: "destructive"
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-0 shadow-glass-lg">
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading your rewards...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!rewards) {
    return (
      <div className="space-y-6">
        <Card className="glass-card border-0 shadow-glass-lg">
          <CardContent className="p-8 text-center">
            <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Rewards Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start earning rewards by making your first order or referring friends!
            </p>
            <Button asChild>
              <a href="/menu">Browse Juices</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableRewardAmount = convertPointsToAmount(rewards.availablePoints);
  const canRedeem = canRedeemPoints(rewards.availablePoints);

  return (
    <div className="space-y-6">
      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-0 shadow-glass-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              Available Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {rewards.availablePoints}
            </div>
            <p className="text-sm text-muted-foreground">
              Worth ₹{availableRewardAmount.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-glass-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{rewards.totalEarned.toFixed(0)}
            </div>
            <p className="text-sm text-muted-foreground">
              From {rewards.referralsCount} referrals
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-glass-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {rewards.referralsCount}
            </div>
            <p className="text-sm text-muted-foreground">
              Friends joined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card className="glass-card border-0 shadow-glass-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share your code with friends and earn ₹{REWARD_CONFIG.REFERRAL_REWARD_AMOUNT} + {REWARD_CONFIG.REFERRAL_REWARD_POINTS} points for each successful referral!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex-1">
              <div className="font-mono text-2xl font-bold text-primary">
                {rewards.referralCode}
              </div>
              <p className="text-sm text-muted-foreground">
                Share this code with friends
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyReferralCode}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={shareReferralCode}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              When someone uses your referral code and completes their first order, you'll earn ₹{REWARD_CONFIG.REFERRAL_REWARD_AMOUNT} and {REWARD_CONFIG.REFERRAL_REWARD_POINTS} points!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Points Redemption */}
      {canRedeem && (
        <Card className="glass-card border-0 shadow-glass-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Redeem Points
            </CardTitle>
            <CardDescription>
              Convert your points to account credit that can be used on future orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-lg font-semibold">
                  {REWARD_CONFIG.MIN_REDEMPTION_POINTS} Points
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{convertPointsToAmount(REWARD_CONFIG.MIN_REDEMPTION_POINTS)}
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => redeemPoints(REWARD_CONFIG.MIN_REDEMPTION_POINTS)}
                  disabled={rewards.availablePoints < REWARD_CONFIG.MIN_REDEMPTION_POINTS || redeemLoading}
                >
                  {redeemLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
                </Button>
              </div>

              {rewards.availablePoints >= 200 && (
                <div className="p-4 border rounded-lg">
                  <div className="text-lg font-semibold">200 Points</div>
                  <div className="text-2xl font-bold text-green-600">₹100</div>
                  <Button
                    className="w-full mt-2"
                    onClick={() => redeemPoints(200)}
                    disabled={rewards.availablePoints < 200 || redeemLoading}
                  >
                    {redeemLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card className="glass-card border-0 shadow-glass-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {transaction.type === 'earned' ? <TrendingUp className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.type === 'earned' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.points} pts
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ₹{transaction.amount.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

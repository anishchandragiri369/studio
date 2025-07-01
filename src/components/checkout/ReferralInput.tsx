"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Check, X, Loader2, Gift } from 'lucide-react';
import { validateReferralCode } from '@/lib/rewards';

interface ReferralInputProps {
  onReferralApply: (referralCode: string, referrerId: string) => void;
  onReferralRemove: () => void;
  appliedReferral?: {
    code: string;
    referrerId: string;
  } | null;
  userId?: string;
  disabled?: boolean;
}

export default function ReferralInput({
  onReferralApply,
  onReferralRemove,
  appliedReferral,
  userId,
  disabled = false
}: ReferralInputProps) {
  const [referralCode, setReferralCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const validation = await validateReferralCode(referralCode.trim(), userId);

      if (validation.isValid && validation.referrerId) {
        onReferralApply(referralCode.trim().toUpperCase(), validation.referrerId);
        setReferralCode('');
      } else {
        setError(validation.error || 'Invalid referral code');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setError('Unable to validate referral code at this time');
    }

    setIsValidating(false);
  };

  const handleRemoveReferral = () => {
    onReferralRemove();
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyReferral();
    }
  };

  if (appliedReferral) {
    return (
      <Card className="glass border-0 border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-medium text-blue-700">
                  Referral Applied: {appliedReferral.code}
                </p>
                <p className="text-sm text-blue-600">
                  You'll help your friend earn rewards!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                <Gift className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveReferral}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                suppressHydrationWarning
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-sm">Have a referral code?</span>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter referral code (e.g., ELX12AB)"
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                disabled={disabled || isValidating}
                className="glass border-border/50 focus:border-blue-500/50 transition-all"
                suppressHydrationWarning
              />
              {error && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyReferral}
              disabled={disabled || isValidating || !referralCode.trim()}
              className="glass border-blue-500/50 text-blue-600 hover:bg-blue-50"
              suppressHydrationWarning
            >
              {isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Help your friend earn rewards when you complete your first order!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

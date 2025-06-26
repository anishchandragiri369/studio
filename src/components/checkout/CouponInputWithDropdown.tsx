"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Check, X, Loader2, ChevronDown, Tag } from 'lucide-react';
import { validateCoupon, type Coupon, COUPONS } from '@/lib/coupons';

interface CouponInputProps {
  orderTotal: number;
  subscriptionType?: 'monthly' | 'weekly' | null;
  userId?: string;
  isAdmin?: boolean; // Add admin flag to show/hide admin-only coupons
  onCouponApply: (coupon: Coupon, discountAmount: number) => void;
  onCouponRemove: () => void;
  appliedCoupon?: {
    coupon: Coupon;
    discountAmount: number;
  } | null;
  disabled?: boolean;
}

export default function CouponInput({
  orderTotal,
  subscriptionType,
  userId,
  isAdmin = false,
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  // Filter available coupons based on subscription type and order total
  const getAvailableCoupons = () => {
    return COUPONS.filter(coupon => {
      if (!coupon.isActive) return false;
      
      // Filter out admin-only coupons for regular users
      if (coupon.adminOnly && !isAdmin) return false;
      
      // Check subscription type compatibility
      if (coupon.validFor !== 'all') {
        if (coupon.validFor === 'monthly' && subscriptionType !== 'monthly') return false;
        if (coupon.validFor === 'weekly' && subscriptionType !== 'weekly') return false;
      }
      
      // Check minimum order amount
      if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) return false;
      
      return true;
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    setError('');

    try {
      const validation = await validateCoupon(
        couponCode.trim(), 
        orderTotal, 
        userId,
        subscriptionType
      );

      if (validation.isValid && validation.coupon && validation.discountAmount !== undefined) {
        onCouponApply(validation.coupon, validation.discountAmount);
        setCouponCode('');
      } else {
        setError(validation.error || 'Invalid coupon');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setError('Unable to validate coupon at this time');
    }

    setIsApplying(false);
  };

  const handleSelectFromDropdown = (selectedCode: string) => {
    setCouponCode(selectedCode);
    setShowDropdown(false);
    setError('');
  };

  const formatCouponDisplay = (coupon: Coupon) => {
    const discountText = coupon.discountType === 'fixed' 
      ? `₹${coupon.discount} off`
      : `${coupon.discount}% off${coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}`;
    
    return `${coupon.code} - ${discountText}`;
  };

  const handleRemoveCoupon = () => {
    onCouponRemove();
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <Card className="glass border-0 border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium text-green-700">
                  Coupon Applied: {appliedCoupon.coupon.code}
                </p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.coupon.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                -₹{appliedCoupon.discountAmount.toFixed(2)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Have a coupon code?</span>
          </div>
          
          <div className="space-y-4">
            {/* Coupon Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Select from available coupons:
              </label>
              <Select onValueChange={handleSelectFromDropdown} disabled={disabled || isApplying}>
                <SelectTrigger className="glass border-border/50 focus:border-primary/50 transition-all">
                  <SelectValue placeholder="Choose a coupon..." />
                </SelectTrigger>
                <SelectContent>                  {getAvailableCoupons().map((coupon) => (
                    <SelectItem key={coupon.code} value={coupon.code}>
                      <div className="flex items-center justify-between w-full min-w-0">
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-primary text-sm">
                              {coupon.code}
                            </span>
                            {coupon.adminOnly && isAdmin && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                ADMIN
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-full">
                            {coupon.description}
                          </span>
                        </div>
                        <Badge variant="outline" className="ml-2 text-xs shrink-0">
                          {coupon.discountType === 'fixed' 
                            ? `₹${coupon.discount} off`
                            : `${coupon.discount}% off`
                          }
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  {getAvailableCoupons().length === 0 && (
                    <SelectItem value="no-coupons" disabled>
                      <span className="text-muted-foreground">No coupons available for this order</span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* Manual Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Enter coupon code manually:
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={disabled || isApplying}
                    className="glass border-border/50 focus:border-primary/50 transition-all"
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
                  onClick={handleApplyCoupon}
                  disabled={disabled || isApplying || !couponCode.trim()}
                  className="glass border-primary/50 text-primary hover:bg-primary/10"
                >
                  {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Available Coupons Info */}
          {getAvailableCoupons().length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm min-w-0 flex-1">
                  <p className="font-medium text-blue-900 mb-2">
                    {getAvailableCoupons().length} coupon{getAvailableCoupons().length > 1 ? 's' : ''} available for your order:
                  </p>
                  <div className="space-y-1">
                    {getAvailableCoupons().slice(0, 3).map((coupon) => (
                      <div key={coupon.code} className="flex items-center justify-between text-blue-700 bg-blue-100/50 rounded px-2 py-1">
                        <span className="font-mono text-xs font-semibold">{coupon.code}</span>
                        <span className="text-xs">
                          {coupon.discountType === 'fixed' 
                            ? `₹${coupon.discount} off`
                            : `${coupon.discount}% off`
                          }
                          {coupon.minOrderAmount && (
                            <span className="text-blue-600 ml-1">
                              (min ₹{coupon.minOrderAmount})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    {getAvailableCoupons().length > 3 && (
                      <p className="text-xs text-blue-600 mt-1">
                        +{getAvailableCoupons().length - 3} more available in dropdown above
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {getAvailableCoupons().length === 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 mb-1">No coupons available</p>
                  <p className="text-amber-700 text-xs">
                    {orderTotal < 300 
                      ? `Add ₹${(300 - orderTotal).toFixed(0)} more to unlock coupons`
                      : subscriptionType 
                        ? 'Try different subscription type or check back later'
                        : 'No applicable coupons for this order'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

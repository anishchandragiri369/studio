"use client";

import { useState, useEffect, useRef } from 'react';
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
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Filter available coupons based on subscription type and order total
  const getAvailableCoupons = () => {
    return COUPONS.filter(coupon => {
      if (!coupon.isActive) return false;
      
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
    }    setIsApplying(false);
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Have a coupon code?</span>
          </div>          <div className="flex gap-2">
            <div className="flex-1 relative" ref={dropdownRef}>
              <div className="flex">
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
                  className="glass border-border/50 focus:border-primary/50 transition-all rounded-r-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={disabled || isApplying}
                  className="glass border-l-0 border-border/50 rounded-l-none px-2"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              
              {/* Coupon Dropdown */}
              {showDropdown && (
                <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto glass border-border/50">
                  <CardContent className="p-2">
                    {getAvailableCoupons().length > 0 ? (
                      <div className="space-y-1">
                        {getAvailableCoupons().map((coupon) => (
                          <button
                            key={coupon.code}
                            onClick={() => handleSelectFromDropdown(coupon.code)}
                            className="w-full text-left p-2 rounded hover:bg-primary/10 transition-colors"
                            disabled={disabled || isApplying}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-mono text-sm font-medium text-primary">
                                  {coupon.code}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {coupon.description}
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {coupon.discountType === 'fixed' 
                                  ? `₹${coupon.discount} off`
                                  : `${coupon.discount}% off`
                                }
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No valid coupons available</p>
                        <p className="text-xs">for this order</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
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
          </div>{/* Popular coupons hint */}
          <div className="text-xs text-muted-foreground">
            <p>Popular codes: <span className="font-mono bg-gray-100 px-1 rounded">welcome200</span>, <span className="font-mono bg-gray-100 px-1 rounded">WELCOME10</span>, <span className="font-mono bg-gray-100 px-1 rounded">JUICE50</span>, <span className="font-mono bg-gray-100 px-1 rounded">MONTHLY200</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface Coupon {
  code: string;
  discount: number;
  discountType: 'fixed' | 'percentage';
  description: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFor: 'all' | 'monthly' | 'weekly';
  isActive: boolean;
  expiryDate?: Date;
  firstOrderOnly?: boolean;
  maxUsesPerUser?: number;
  adminOnly?: boolean; // Admin-only coupons - not visible in dropdown to regular users
}

export const COUPONS: Coupon[] = [
  {
    code: 'welcome200',
    discount: 200,
    discountType: 'fixed',
    description: '₹200 off on your first order',
    minOrderAmount: 1200,
    validFor: 'all',
    isActive: true,
    firstOrderOnly: true,
    maxUsesPerUser: 1,
  },
  {
    code: 'WELCOME10',
    discount: 10,
    discountType: 'percentage',
    description: '10% off on first order',
    minOrderAmount: 300,
    maxDiscountAmount: 150,
    validFor: 'all',
    isActive: true,
    firstOrderOnly: true,
    maxUsesPerUser: 1,
  },
  {
    code: 'JUICE50',
    discount: 50,
    discountType: 'fixed',
    description: '₹50 off on orders above ₹300',
    minOrderAmount: 300,
    validFor: 'all',
    isActive: true,
    maxUsesPerUser: 5,
  },  {
    code: 'MONTHLY200',
    discount: 200,
    discountType: 'fixed',
    description: '₹200 off on monthly subscriptions',
    minOrderAmount: 500,
    validFor: 'monthly',
    isActive: true,
    maxUsesPerUser: 1,
  },
  // Admin-only coupons - not visible to regular users in dropdown
  {
    code: 'ADMIN500',
    discount: 500,
    discountType: 'fixed',
    description: 'Admin Special - ₹500 off',
    minOrderAmount: 1000,
    validFor: 'all',
    isActive: true,
    maxUsesPerUser: 1,
    adminOnly: true,
  },
  {
    code: 'SUPPORT25',
    discount: 25,
    discountType: 'percentage',
    description: 'Customer Support - 25% off',
    minOrderAmount: 200,
    maxDiscountAmount: 300,
    validFor: 'all',
    isActive: true,
    maxUsesPerUser: 1,
    adminOnly: true,
  },
  {
    code: 'EMERGENCY100',
    discount: 100,
    discountType: 'fixed',
    description: 'Emergency Discount - ₹100 off',
    minOrderAmount: 400,
    validFor: 'all',
    isActive: true,
    maxUsesPerUser: 2,
    adminOnly: true,
  },
  {
    code: 'VIP30',
    discount: 30,
    discountType: 'percentage',
    description: 'VIP Customer - 30% off',
    minOrderAmount: 800,
    maxDiscountAmount: 500,
    validFor: 'all',
    isActive: true,
    maxUsesPerUser: 3,
    adminOnly: true,
  },
];

export const validateCoupon = async (
  couponCode: string,
  orderTotal: number,
  userId?: string,
  subscriptionType?: 'monthly' | 'weekly' | null
): Promise<{
  isValid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}> => {
  const coupon = COUPONS.find(c => c.code.toLowerCase() === couponCode.toLowerCase() && c.isActive);
  
  if (!coupon) {
    return { isValid: false, error: 'Invalid coupon code' };
  }

  if (coupon.expiryDate && new Date() > coupon.expiryDate) {
    return { isValid: false, error: 'Coupon has expired' };
  }

  if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
    return { 
      isValid: false, 
      error: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
    };
  }

  if (coupon.validFor !== 'all') {
    if (coupon.validFor === 'monthly' && subscriptionType !== 'monthly') {
      return { isValid: false, error: 'This coupon is only valid for monthly subscriptions' };
    }
    if (coupon.validFor === 'weekly' && subscriptionType !== 'weekly') {
      return { isValid: false, error: 'This coupon is only valid for weekly subscriptions' };
    }
  }

  // Check if user-specific validation is needed
  if (userId && (coupon.firstOrderOnly || coupon.maxUsesPerUser)) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: coupon.code,
          userId,
          firstOrderOnly: coupon.firstOrderOnly,
          maxUsesPerUser: coupon.maxUsesPerUser
        })
      });
      
      const result = await response.json();
      if (!result.success) {
        return { isValid: false, error: result.message };
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { isValid: false, error: 'Unable to validate coupon at this time' };
    }
  }

  let discountAmount = 0;
  if (coupon.discountType === 'fixed') {
    discountAmount = coupon.discount;
  } else {
    discountAmount = (orderTotal * coupon.discount) / 100;
    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  }

  // Ensure discount doesn't exceed order total
  discountAmount = Math.min(discountAmount, orderTotal);

  return {
    isValid: true,
    coupon,
    discountAmount
  };
};

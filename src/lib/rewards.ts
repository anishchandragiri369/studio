export interface ReferralReward {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  rewardPoints: number;
  rewardAmount: number;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  orderId?: string;
}

export interface UserRewards {
  userId: string;
  totalPoints: number;
  totalEarned: number;
  referralCode: string;
  referralsCount: number;
  lastUpdated: Date;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed';
  points: number;
  amount: number;
  description: string;
  orderId?: string;
  referralId?: string;
  createdAt: Date;
}

// Reward configuration
export const REWARD_CONFIG = {
  // Points earned when someone uses your referral code and makes first order
  REFERRAL_REWARD_POINTS: 100,
  REFERRAL_REWARD_AMOUNT: 50, // ₹50 for successful referral
  
  // Points to rupee conversion (100 points = ₹50)
  POINTS_TO_RUPEE_RATIO: 0.5,
  
  // Minimum points needed to redeem
  MIN_REDEMPTION_POINTS: 100,
  
  // Maximum reward amount that can be used per order
  MAX_REWARD_PER_ORDER: 500,
  
  // Referral code settings
  REFERRAL_CODE_LENGTH: 8,
  REFERRAL_CODE_PREFIX: 'ELX',
};

export const generateReferralCode = (userId: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = REWARD_CONFIG.REFERRAL_CODE_PREFIX;
  
  // Use part of user ID for uniqueness
  const userHash = userId.slice(-4).toUpperCase();
  result += userHash;
  
  // Add random characters
  for (let i = 0; i < REWARD_CONFIG.REFERRAL_CODE_LENGTH - REWARD_CONFIG.REFERRAL_CODE_PREFIX.length - 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

export const validateReferralCode = async (referralCode: string, userId?: string): Promise<{
  isValid: boolean;
  referrerId?: string;
  error?: string;
}> => {
  if (!referralCode || referralCode.length < 6) {
    return { isValid: false, error: 'Invalid referral code format' };
  }

  try {
    const { apiPost } = await import('./apiUtils');
    const result = await apiPost('/api/referrals/validate', { 
      referralCode, 
      userId 
    });
    
    // Convert API response format to expected format
    if (result.success && result.referrerId) {
      return { 
        isValid: true, 
        referrerId: result.referrerId 
      };
    } else {
      return { 
        isValid: false, 
        error: result.message || 'Invalid referral code' 
      };
    }
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    
    // Extract the actual error message from the API response
    let errorMessage = 'Unable to validate referral code';
    
    if (error.message) {
      if (error.message.includes('You cannot use your own referral code')) {
        errorMessage = 'Self-referrals are not allowed. You cannot use your own referral code.';
      } else if (error.message.includes('Invalid referral code')) {
        errorMessage = 'Invalid referral code';
      } else if (error.message.includes('already used')) {
        errorMessage = 'You have already used this referral code';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { isValid: false, error: errorMessage };
  }
};

export const calculateRewardPoints = (amount: number): number => {
  // 1 point per ₹10 spent
  return Math.floor(amount / 10);
};

export const convertPointsToAmount = (points: number): number => {
  return points * REWARD_CONFIG.POINTS_TO_RUPEE_RATIO;
};

export const canRedeemPoints = (points: number): boolean => {
  return points >= REWARD_CONFIG.MIN_REDEMPTION_POINTS;
};

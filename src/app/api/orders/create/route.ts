import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { OrderItem, CheckoutAddressFormData } from '@/lib/types';
import { 
  calculateFirstDeliveryDate, 
  generateSubscriptionDeliveryDatesWithSettings,
  clearDeliverySettingsCache,
  type DeliverySchedule,
  type SubscriptionDeliveryDates 
} from '@/lib/deliverySchedulerWithSettings';
import { validatePincode } from '@/lib/pincodeValidation';
import { logger, createLoggedResponse } from '@/lib/logger';

export async function POST(req: NextRequest) {
  if (!supabase) {
    logger.error('Supabase client not initialized', {}, 'Orders API');
    return NextResponse.json(
      createLoggedResponse(false, 'Database connection not available.', {}, 503, 'error'),
      { status: 503 }
    );
  }
  
  try {
    logger.info('Order creation request received', {}, 'Orders API');
    const body = await req.json();
    const { orderAmount, originalAmount, appliedCoupon, appliedReferral, orderItems, customerInfo, userId, subscriptionData, hasSubscriptions, hasRegularItems } = body;

    logger.debug('Order request data', { 
      orderAmount, 
      itemCount: orderItems?.length, 
      hasSubscriptions, 
      hasRegularItems,
      userId: userId ? '[PROVIDED]' : '[MISSING]'
    }, 'Orders API');

    // Validation
    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json(createLoggedResponse(false, 'Invalid order amount.', {}, 400, 'error'), { status: 400 });
    }
    
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json({ success: false, message: 'Order items are required.' }, { status: 400 });
    }
    
    if (!customerInfo) {
      return NextResponse.json({ success: false, message: 'Customer info is required.' }, { status: 400 });
    }
    
    if (!customerInfo.name || !customerInfo.email) {
      return NextResponse.json({ success: false, message: 'Customer name and email are required.' }, { status: 400 });
    }
    
    // Validate pincode for delivery area
    if (!customerInfo.address?.zipCode) {
      return NextResponse.json({ success: false, message: 'Pincode is required for delivery.' }, { status: 400 });
    }
    
    const pincodeValidation = validatePincode(customerInfo.address.zipCode);
    if (!pincodeValidation.isServiceable) {
      return NextResponse.json({ 
        success: false, 
        message: 'Sorry, we don\'t deliver to this pincode yet. Please contact us for delivery updates!',
        pincodeError: true
      }, { status: 400 });
    }
    
    // Determine if this order contains subscriptions - check multiple sources
    const containsSubscriptions = hasSubscriptions || 
                                 subscriptionData || 
                                 orderItems.some((item: any) => item.type === 'subscription');
    
    // Determine order type based on content
    let orderType: string;
    if (containsSubscriptions && hasRegularItems) {
      orderType = 'mixed'; // Both subscription and regular items
    } else if (containsSubscriptions) {
      orderType = 'subscription'; // Only subscription items
    } else {
      orderType = 'one_time'; // Only regular items
    }    // Calculate delivery dates for subscription orders
    let deliverySchedule: DeliverySchedule | null = null;
    let subscriptionDeliveryDates: SubscriptionDeliveryDates | null = null;
    
    if (containsSubscriptions) {
      // Calculate the first delivery date based on order time and 6 PM cutoff
      deliverySchedule = calculateFirstDeliveryDate(new Date());
      
      // Generate all delivery dates for the subscription period
      // For mixed orders, use subscription data from the first subscription item
      let subscriptionInfo = subscriptionData;
      if (!subscriptionInfo) {
        // Extract subscription info from subscription items
        const subscriptionItem = orderItems.find((item: any) => item.type === 'subscription');
        if (subscriptionItem?.subscriptionData) {
          subscriptionInfo = {
            frequency: subscriptionItem.subscriptionData.planFrequency,
            duration: subscriptionItem.subscriptionData.subscriptionDuration
          };
        }
      }
      
      if (subscriptionInfo?.frequency && subscriptionInfo?.duration) {
        // Determine subscription type from order items
        let subscriptionType = 'customized'; // default
        const subscriptionItem = orderItems.find((item: any) => item.type === 'subscription');
        
        if (subscriptionItem) {
          // Try to determine subscription type from item details
          if (subscriptionItem.name?.toLowerCase().includes('juice')) {
            subscriptionType = 'juices';
          } else if (subscriptionItem.name?.toLowerCase().includes('fruit') && subscriptionItem.name?.toLowerCase().includes('bowl')) {
            subscriptionType = 'fruit_bowls';
          } else if (subscriptionItem.category?.toLowerCase().includes('juice')) {
            subscriptionType = 'juices';
          } else if (subscriptionItem.category?.toLowerCase().includes('fruit')) {
            subscriptionType = 'fruit_bowls';
          }
        }
        
        subscriptionDeliveryDates = await generateSubscriptionDeliveryDatesWithSettings(
          subscriptionType,
          subscriptionInfo.duration,
          deliverySchedule.firstDeliveryDate
        );
      }
    }

    // Check for pending referral code from user metadata
    let pendingReferralCode = null;
    let referrerUserId = null;
    
    if (userId && !appliedReferral) {
      try {
        // Get user metadata to check for pending referral code
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (user && user.user_metadata?.pendingReferralCode) {
          const referralCode = user.user_metadata.pendingReferralCode;
          
          // Validate the referral code and get referrer info (case-insensitive)
          const { data: referrer, error: referrerError } = await supabase
            .from('user_rewards')
            .select('user_id, referral_code')
            .ilike('referral_code', referralCode)
            .single();
            
          if (!referrerError && referrer && referrer.user_id !== userId) {
            pendingReferralCode = referrer.referral_code; // Use actual referral code from DB
            referrerUserId = referrer.user_id;
            
            // Clear the pending referral code from user metadata
            await supabase.auth.updateUser({
              data: { 
                pendingReferralCode: null 
              }
            });
            
            logger.info('Applied pending referral code to order', { 
              referralCode, 
              referrerUserId,
              userId 
            }, 'Orders API');
          }
        }
      } catch (error) {
        logger.warn('Failed to process pending referral code', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Orders API');
        // Don't fail the order for this
      }
    }

    const orderToInsert = {
      user_id: userId,
      email: customerInfo.email, // Add email field
      total_amount: orderAmount,
      original_amount: originalAmount || orderAmount,
      coupon_code: appliedCoupon?.code || null,
      discount_amount: appliedCoupon?.discountAmount || 0,
      referral_code: appliedReferral?.code || pendingReferralCode || null,
      referrer_id: appliedReferral?.referrerId || referrerUserId || null,
      items: orderItems,
      shipping_address: customerInfo, // <-- FIXED: use shipping_address
      status: 'payment_pending', // Use snake_case for consistency
      order_type: orderType, // Use the new calculated order type
      subscription_info: containsSubscriptions ? (() => {
        // Extract subscription data from subscription items
        const subscriptionItem = orderItems.find((item: any) => item.type === 'subscription');
        if (subscriptionItem?.subscriptionData) {
          const subData = subscriptionItem.subscriptionData;
          return {
            planName: subData.planName || subscriptionItem.name,
            planFrequency: subData.planFrequency || 'weekly',
            subscriptionDuration: subData.subscriptionDuration || 1,
            basePrice: subData.basePrice || subscriptionItem.price || 0,
            selectedCategory: subData.selectedCategory || null,
            selectedJuices: subData.selectedJuices || [],
            selectedFruitBowls: subData.selectedFruitBowls || [],
            categoryDistribution: subData.categoryDistribution || null,
            // Also keep the original structure for backward compatibility
            subscriptionItems: orderItems.filter((item: any) => item.type === 'subscription')
          };
        }
        return subscriptionData || {
          hasSubscriptionItems: true,
          subscriptionItems: orderItems.filter((item: any) => item.type === 'subscription')
        };
      })() : null, // Store subscription details
      // Add delivery scheduling information
      first_delivery_date: deliverySchedule?.firstDeliveryDate?.toISOString() || null,
      is_after_cutoff: deliverySchedule?.isAfterCutoff || null,
      delivery_schedule: subscriptionDeliveryDates ? {
        startDate: subscriptionDeliveryDates.startDate.toISOString(),
        endDate: subscriptionDeliveryDates.endDate.toISOString(),
        deliveryDates: subscriptionDeliveryDates.deliveryDates.map(date => date.toISOString()),
        totalDeliveries: subscriptionDeliveryDates.totalDeliveries
      } : null,
    };

    logger.info('Attempting to insert order', { 
      orderId: 'PENDING', 
      orderType, 
      totalAmount: orderAmount,
      containsSubscriptions,
      hasDeliverySchedule: !!deliverySchedule
    }, 'Orders API');

    const { data, error } = await supabase
      .from('orders')
      .insert([orderToInsert])
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to insert order into database', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, 'Orders API');
      return NextResponse.json(
        createLoggedResponse(false, 'Failed to create order in database.', { error }, 500, 'error'),
        { status: 500 }
      );
    }

    const orderId = data.id;
    logger.info('Order created successfully', { orderId, orderType }, 'Orders API');

    // Process coupon usage if coupon was applied
    if (appliedCoupon && userId) {
      try {
        const { error: couponError } = await supabase
          .from('coupon_usage')
          .insert([{
            user_id: userId,
            coupon_code: appliedCoupon.code,
            order_id: orderId,
            discount_amount: appliedCoupon.discountAmount,
            used_at: new Date().toISOString()
          }]);

        if (couponError) {
          logger.error('Error recording coupon usage', { error: couponError.message }, 'Orders API');
        }
      } catch (couponError) {
        logger.error('Error processing coupon usage', { error: couponError }, 'Orders API');
      }
    }

    // Process referral rewards if referral was applied
    if (appliedReferral && userId) {
      try {
        const { error: referralError } = await supabase
          .from('referral_rewards')
          .insert([{
            user_id: userId,
            referrer_id: appliedReferral.referrerId,
            order_id: orderId,
            reward_amount: appliedReferral.rewardAmount,
            referral_code: appliedReferral.code,
            earned_at: new Date().toISOString()
          }]);

        if (referralError) {
          logger.error('Error recording referral reward', { error: referralError.message }, 'Orders API');
        }
      } catch (referralError) {
        logger.error('Error processing referral reward', { error: referralError }, 'Orders API');
      }
    }

    // Initialize user rewards if not exists
    if (userId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/rewards/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        logger.debug('User rewards initialization requested', { userId }, 'Orders API');
      } catch (rewardError) {
        logger.warn('Error initializing user rewards', { rewardError }, 'Orders API');
      }
    }

    logger.info('Order creation completed successfully', { orderId, orderType }, 'Orders API');
    return NextResponse.json(createLoggedResponse(true, 'Order created successfully!', {
      id: orderId,
      orderType,
      totalAmount: orderAmount,
      containsSubscriptions,
      deliverySchedule: deliverySchedule ? {
        firstDeliveryDate: deliverySchedule.firstDeliveryDate.toISOString(),
        isAfterCutoff: deliverySchedule.isAfterCutoff,
        orderCutoffTime: deliverySchedule.orderCutoffTime.toISOString()
      } : null
    }));

  } catch (error: any) {
    logger.error('General error in order creation', { 
      error: error.message, 
      stack: error.stack?.substring(0, 500) 
    }, 'Orders API');
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        createLoggedResponse(false, `Invalid JSON payload: ${error.message}`, {}, 400, 'error'),
        { status: 400 }
      );
    }
    return NextResponse.json(
      createLoggedResponse(false, error.message || 'An unexpected server error occurred.', {}, 500, 'error'),
      { status: 500 }
    );
  }
}

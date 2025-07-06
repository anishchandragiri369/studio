import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import type { CheckoutAddressFormData } from '@/lib/types';
import { 
  calculateFirstDeliveryDate, 
  generateSubscriptionDeliveryDatesWithSettings,
  clearDeliverySettingsCache,
  type DeliverySchedule,
  type SubscriptionDeliveryDates 
} from '@/lib/deliverySchedulerWithSettings';
import { validatePincode } from '@/lib/pincodeValidation';
import { logger, createLoggedResponse } from '@/lib/logger';
import { validateAdminPauseForSubscription } from '@/lib/adminPauseHelper';

export async function POST(req: NextRequest) {
  if (!supabase) {
    logger.error('Supabase client not initialized', {}, 'Subscriptions API');
    return NextResponse.json(
      createLoggedResponse(false, 'Database connection not available.', {}, 503, 'error'),
      { status: 503 }
    );
  }

  try {
    logger.info('Subscription creation request received', {}, 'Subscriptions API');
    const body = await req.json();
    const { 
      userId, 
      planId, 
      planName, 
      planPrice, 
      planFrequency, 
      customerInfo, 
      selectedJuices,
      selectedFruitBowls, // Add support for fruit bowls
      selectedCategory, // Add selected category
      categoryDistribution, // Add category distribution
      subscriptionDuration = 3, // Default to 3 months if not provided
      basePrice = 120 // Default base price if not provided
    } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Check for admin pause before allowing subscription creation
    const adminPauseValidation = await validateAdminPauseForSubscription(userId);
    if (!adminPauseValidation.canProceed) {
      return NextResponse.json(
        { success: false, message: adminPauseValidation.message, adminPause: true },
        { status: 423 } // 423 Locked
      );
    }

    if (!planId || !planName || !planPrice || !planFrequency) {
      return NextResponse.json(
        { success: false, message: 'Plan details are required.' },
        { status: 400 }
      );
    }

    if (!customerInfo) {
      return NextResponse.json(
        { success: false, message: 'Customer information is required.' },
        { status: 400 }
      );
    }

    // Validate pincode for delivery area - handle different address structures
    const zipCode = customerInfo.address?.zipCode || customerInfo.zipCode;
    if (!zipCode) {
      return NextResponse.json({ 
        success: false, 
        message: 'Pincode is required for delivery.' 
      }, { status: 400 });
    }
    
    const pincodeValidation = validatePincode(zipCode);
    if (!pincodeValidation.isServiceable) {
      return NextResponse.json({ 
        success: false, 
        message: 'Sorry, we don\'t deliver to this pincode yet. Please contact us for delivery updates!',
        pincodeError: true
      }, { status: 400 });
    }

    if (!['weekly', 'monthly'].includes(planFrequency)) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan frequency.' },
        { status: 400 }
      );
    }

    if (!subscriptionDuration || typeof subscriptionDuration !== 'number' || subscriptionDuration < 1 || subscriptionDuration > 12) {
      logger.warn('Invalid subscription duration attempted', { 
        subscriptionDuration, 
        allowedRange: '1-12 months' 
      }, 'Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'Invalid subscription duration. Duration must be between 1 and 12 months.', { subscriptionDuration }, 400, 'error'),
        { status: 400 }
      );
    }

    // Calculate subscription pricing
    const pricing = SubscriptionManager.calculateSubscriptionPricing(basePrice, subscriptionDuration);

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = SubscriptionManager.calculateSubscriptionEndDate(startDate, subscriptionDuration);

    // Use new delivery scheduling system with 6 PM cutoff
    const deliverySchedule: DeliverySchedule = calculateFirstDeliveryDate(new Date());
    
    // Determine subscription type based on plan and selections
    let subscriptionType = 'customized'; // default for mixed or unspecified plans
    const planNameLower = planName?.toLowerCase() ?? '';
    const hasJuices = selectedJuices && selectedJuices.length > 0;
    const hasFruitBowls = selectedFruitBowls && selectedFruitBowls.length > 0;
    
    if (planNameLower.includes('juice') && !hasFruitBowls) {
      subscriptionType = 'juices';
    } else if (planNameLower.includes('fruit') && planNameLower.includes('bowl') && !hasJuices) {
      subscriptionType = 'fruit_bowls';
    } else if (hasJuices && !hasFruitBowls) {
      subscriptionType = 'juices'; // Only juices selected
    } else if (hasFruitBowls && !hasJuices) {
      subscriptionType = 'fruit_bowls'; // Only fruit bowls selected
    }
    // If hasJuices && hasFruitBowls, it remains 'customized'
    
    // Generate all delivery dates for the subscription period using admin settings
    const subscriptionDeliveryDates: SubscriptionDeliveryDates = await generateSubscriptionDeliveryDatesWithSettings(
      subscriptionType,
      subscriptionDuration, // Duration in months
      deliverySchedule.firstDeliveryDate
    );
    
    // Set first delivery time to 10 AM
    const nextDeliveryDate = new Date(deliverySchedule.firstDeliveryDate);
    nextDeliveryDate.setHours(8, 0, 0, 0);

    // Create subscription record with delivery schedule
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      delivery_frequency: planFrequency,
      selected_juices: selectedJuices ?? [],
      selected_fruit_bowls: selectedFruitBowls ?? [], // Store fruit bowls for mixed subscriptions
      selected_category: selectedCategory, // Store selected category
      category_distribution: categoryDistribution, // Store category distribution
      delivery_address: customerInfo,
      total_amount: pricing.finalPrice,
      subscription_duration: subscriptionDuration,
      subscription_start_date: startDate.toISOString(),
      subscription_end_date: endDate.toISOString(),
      next_delivery_date: nextDeliveryDate.toISOString(),
      original_price: pricing.originalPrice,
      discount_percentage: pricing.discountPercentage,
      discount_amount: pricing.discountAmount,
      final_price: pricing.finalPrice,
      renewal_notification_sent: false,
      created_at: startDate.toISOString(),
      updated_at: startDate.toISOString(),
      // Add delivery schedule information
      first_delivery_date: deliverySchedule.firstDeliveryDate.toISOString(),
      is_after_cutoff: deliverySchedule.isAfterCutoff,
      delivery_schedule: {
        startDate: subscriptionDeliveryDates.startDate.toISOString(),
        endDate: subscriptionDeliveryDates.endDate.toISOString(),
        deliveryDates: subscriptionDeliveryDates.deliveryDates.map(date => date.toISOString()),
        totalDeliveries: subscriptionDeliveryDates.totalDeliveries
      }
    };

    logger.info('Attempting to create subscription', { 
      userId, 
      planId, 
      planName, 
      frequency: planFrequency,
      totalAmount: planPrice 
    }, 'Subscriptions API');

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (subscriptionError) {
      logger.error('Failed to create subscription', {
        error: subscriptionError.message,
        code: subscriptionError.code,
        userId,
        planId
      }, 'Subscriptions API');
      return NextResponse.json(
        createLoggedResponse(false, 'Failed to create subscription.', { error: subscriptionError.message }, 500, 'error'),
        { status: 500 }
      );
    }

    logger.info('Subscription created successfully', { 
      subscriptionId: subscription.id, 
      userId, 
      planId 
    }, 'Subscriptions API');    // Generate delivery schedule using new delivery scheduling system
    const deliveryRecords = subscriptionDeliveryDates.deliveryDates.map(deliveryDate => {
      const deliveryDateTime = new Date(deliveryDate);
      deliveryDateTime.setHours(8, 0, 0, 0); // Set delivery time to 8 AM
      
      return {
        subscription_id: subscription.id,
        delivery_date: deliveryDateTime.toISOString(),
        status: 'scheduled',
        items: selectedJuices ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const { error: deliveryError } = await supabase
      .from('subscription_deliveries')
      .insert(deliveryRecords);

    if (deliveryError) {
      console.error('Error creating delivery record:', deliveryError);
      // Don't fail the subscription creation if delivery record fails
    }

    return NextResponse.json(createLoggedResponse(true, 'Subscription created successfully!', {
      subscription,
      pricing,
      nextDeliveryDate: nextDeliveryDate.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
      deliverySchedule: {
        firstDeliveryDate: deliverySchedule.firstDeliveryDate.toISOString(),
        isAfterCutoff: deliverySchedule.isAfterCutoff,
        orderCutoffTime: deliverySchedule.orderCutoffTime.toISOString(),
        totalDeliveries: subscriptionDeliveryDates.totalDeliveries,
        allDeliveryDates: subscriptionDeliveryDates.deliveryDates.map(date => date.toISOString())
      }
    }));

  } catch (error: any) {
    logger.error('Error creating subscription', { error: error.message }, 'Subscriptions API');
    return NextResponse.json(
      createLoggedResponse(false, 'An unexpected error occurred.', {}, 500, 'error'),
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { 
  getDeliveryScheduleSettings,
  calculateNextDeliveryDate,
  getSubscriptionTypeFromPlanId,
  formatDeliverySchedule
} from '@/lib/deliveryScheduleHelper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_type, plan_id, current_date } = body;

    let subscriptionType = subscription_type;
    
    // If plan_id is provided instead of subscription_type, derive the type
    if (plan_id && !subscription_type) {
      subscriptionType = getSubscriptionTypeFromPlanId(plan_id);
    }

    if (!subscriptionType) {
      return NextResponse.json(
        { error: 'Either subscription_type or plan_id is required' },
        { status: 400 }
      );
    }

    const currentDate = current_date ? new Date(current_date) : new Date();
    
    // Get current settings
    const settings = await getDeliveryScheduleSettings();
    const currentSetting = settings.find(s => s.subscription_type === subscriptionType);
    
    if (!currentSetting) {
      return NextResponse.json(
        { error: `No delivery schedule setting found for subscription type: ${subscriptionType}` },
        { status: 404 }
      );
    }

    // Calculate next delivery date
    const nextDeliveryDate = await calculateNextDeliveryDate(subscriptionType, currentDate);

    // Calculate multiple future dates for demonstration
    const futureDates = [];
    let tempDate = new Date(currentDate);
    for (let i = 0; i < 5; i++) {
      tempDate = await calculateNextDeliveryDate(subscriptionType, tempDate);
      futureDates.push(new Date(tempDate));
    }

    return NextResponse.json({
      success: true,
      subscription_type: subscriptionType,
      current_settings: {
        delivery_gap_days: currentSetting.delivery_gap_days,
        is_daily: currentSetting.is_daily,
        description: currentSetting.description,
        formatted_schedule: formatDeliverySchedule(
          currentSetting.delivery_gap_days, 
          currentSetting.is_daily
        )
      },
      calculation_input: {
        current_date: currentDate.toISOString(),
        plan_id: plan_id ?? null
      },
      next_delivery_date: nextDeliveryDate.toISOString(),
      next_five_deliveries: futureDates.map(date => date.toISOString()),
      days_until_next_delivery: Math.ceil(
        (nextDeliveryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    });

  } catch (error) {
    console.error('Error in delivery schedule test API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get all current settings and provide testing information
    const settings = await getDeliveryScheduleSettings();
    
    const testData = {
      success: true,
      current_settings: settings,
      test_plan_ids: [
        'juice_weekly',
        'juice_monthly', 
        'fruit_bowl_daily',
        'fruit_bowl_weekly',
        'customized_weekly',
        'customized_monthly'
      ],
      subscription_types: ['juices', 'fruit_bowls', 'customized'],
      usage_examples: {
        test_with_subscription_type: {
          method: 'POST',
          body: {
            subscription_type: 'juices',
            current_date: '2025-01-01T00:00:00Z'
          }
        },
        test_with_plan_id: {
          method: 'POST', 
          body: {
            plan_id: 'juice_weekly',
            current_date: '2025-01-01T00:00:00Z'
          }
        }
      }
    };

    return NextResponse.json(testData);

  } catch (error) {
    console.error('Error in delivery schedule test API GET:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

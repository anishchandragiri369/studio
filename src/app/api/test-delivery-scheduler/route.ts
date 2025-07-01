import { NextRequest, NextResponse } from 'next/server';
import { 
  calculateFirstDeliveryDate, 
  generateSubscriptionDeliveryDates,
  formatDeliveryDate,
  type DeliverySchedule,
  type SubscriptionDeliveryDates 
} from '@/lib/deliveryScheduler';
import { checkDevAccess } from '@/lib/dev-protection';

export async function GET(request: NextRequest) {
  // Check if development access is allowed
  const accessCheck = checkDevAccess();
  if (!accessCheck.allowed) {
    return accessCheck.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency') || 'weekly';
    const duration = parseInt(searchParams.get('duration') || '4');
    const orderTimeStr = searchParams.get('orderTime');
    
    // Parse order time or use current time
    const orderTime = orderTimeStr ? new Date(orderTimeStr) : new Date();
    
    // Calculate the first delivery date based on order time and 6 PM cutoff
    const deliverySchedule: DeliverySchedule = calculateFirstDeliveryDate(orderTime);
    
    // Generate all delivery dates for the subscription period
    const subscriptionDeliveryDates: SubscriptionDeliveryDates = generateSubscriptionDeliveryDates(
      frequency as 'daily' | 'weekly' | 'monthly',
      duration,
      deliverySchedule.firstDeliveryDate
    );
    
    return NextResponse.json({
      success: true,
      data: {
        orderTime: orderTime.toISOString(),
        cutoffTime: deliverySchedule.orderCutoffTime.toISOString(),
        isAfterCutoff: deliverySchedule.isAfterCutoff,
        firstDeliveryDate: deliverySchedule.firstDeliveryDate.toISOString(),
        firstDeliveryFormatted: formatDeliveryDate(deliverySchedule.firstDeliveryDate),
        subscriptionPeriod: {
          startDate: subscriptionDeliveryDates.startDate.toISOString(),
          endDate: subscriptionDeliveryDates.endDate.toISOString(),
          totalDeliveries: subscriptionDeliveryDates.totalDeliveries
        },
        allDeliveryDates: subscriptionDeliveryDates.deliveryDates.map(date => ({
          date: date.toISOString(),
          formatted: formatDeliveryDate(date)
        })),
        summary: {
          frequency,
          duration,
          cutoffRule: deliverySchedule.isAfterCutoff 
            ? `Order placed after 6 PM - first delivery on ${formatDeliveryDate(deliverySchedule.firstDeliveryDate)}`
            : `Order placed before 6 PM - first delivery on ${formatDeliveryDate(deliverySchedule.firstDeliveryDate)}`
        }
      }
    });

  } catch (error: any) {
    console.error('Error testing delivery scheduler:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to test delivery scheduler.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check if development access is allowed
  const accessCheck = checkDevAccess();
  if (!accessCheck.allowed) {
    return accessCheck.response;
  }

  try {
    const body = await request.json();
    const { frequency = 'daily', duration = 2, orderTime } = body; // Default to 2 months for testing
    
    // Parse order time or use current time
    const testOrderTime = orderTime ? new Date(orderTime) : new Date();
    
    // Test specific scenarios based on user's example
    const scenarios = [
      { 
        name: 'Order on 15th at 6 PM (exactly cutoff)', 
        time: new Date(2025, 5, 15, 18, 0) // June 15, 2025 at 6 PM
      },
      { 
        name: 'Order on 15th at 5 PM (before cutoff)', 
        time: new Date(2025, 5, 15, 17, 0) // June 15, 2025 at 5 PM
      },
      { 
        name: 'Order on 15th at 8 PM (after cutoff)', 
        time: new Date(2025, 5, 15, 20, 0) // June 15, 2025 at 8 PM
      },
      {
        name: 'Order on Saturday at 5 PM (next day is Sunday)',
        time: new Date(2025, 5, 14, 17, 0) // June 14, 2025 (Saturday) at 5 PM
      },
      {
        name: 'Order on Saturday at 8 PM (delivery would be Monday)',
        time: new Date(2025, 5, 14, 20, 0) // June 14, 2025 (Saturday) at 8 PM
      }
    ];
    
    const results = scenarios.map(scenario => {
      const deliverySchedule = calculateFirstDeliveryDate(scenario.time);
      const subscriptionDeliveryDates = generateSubscriptionDeliveryDates(
        frequency as 'daily' | 'weekly' | 'monthly',
        duration,
        deliverySchedule.firstDeliveryDate
      );
      
      // Show first 10 delivery dates for clarity
      const firstTenDeliveries = subscriptionDeliveryDates.deliveryDates
        .slice(0, 10)
        .map(date => ({
          date: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
          isSunday: date.getDay() === 0
        }));
      
      return {
        scenario: scenario.name,
        orderTime: scenario.time.toLocaleString(),
        orderDay: scenario.time.toLocaleDateString('en-US', { weekday: 'long' }),
        isAfterCutoff: deliverySchedule.isAfterCutoff,
        firstDeliveryDate: formatDeliveryDate(deliverySchedule.firstDeliveryDate),
        firstDeliveryDay: deliverySchedule.firstDeliveryDate.toLocaleDateString('en-US', { weekday: 'long' }),
        totalDeliveries: subscriptionDeliveryDates.totalDeliveries,
        deliveryPeriod: `${formatDeliveryDate(subscriptionDeliveryDates.startDate)} to ${formatDeliveryDate(subscriptionDeliveryDates.endDate)}`,
        firstTenDeliveries,
        hasSundayDeliveries: subscriptionDeliveryDates.deliveryDates.some(date => date.getDay() === 0)
      };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Delivery scheduling test completed with Sunday exclusion',
      data: {
        testParameters: { frequency, duration },
        note: 'Daily deliveries exclude Sundays. If calculated delivery date falls on Sunday, it moves to Monday.',
        scenarios: results
      }
    });

  } catch (error: any) {
    console.error('Error in delivery scheduler test POST:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to test delivery scheduler.' },
      { status: 500 }
    );
  }
}

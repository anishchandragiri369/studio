import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionManager } from '@/lib/subscriptionManager';
import { generateSubscriptionDeliveryDates } from '@/lib/deliveryScheduler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency') as 'weekly' | 'monthly' || 'monthly';
    const startDate = searchParams.get('startDate') || new Date().toISOString();
    const duration = parseInt(searchParams.get('duration') || '1');

    const start = new Date(startDate);
    
    // Test the delivery scheduling logic
    const deliveryDates = generateSubscriptionDeliveryDates(frequency, duration, start);
    
    // Check for 1-day gaps and Sunday exclusion
    const analysis = {
      totalDeliveries: deliveryDates.totalDeliveries,
      startDate: deliveryDates.startDate.toISOString(),
      endDate: deliveryDates.endDate.toISOString(),
      deliveryDates: deliveryDates.deliveryDates.map(date => ({
        date: date.toISOString(),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNumber: date.getDay()
      })),
      validation: {
        hasSundayDeliveries: deliveryDates.deliveryDates.some(date => date.getDay() === 0),
        dayGaps: [] as Array<{
          from: string;
          to: string;
          gapDays: number;
          isValid: boolean;
        }>
      }
    };

    // Check gaps between consecutive deliveries for monthly subscriptions
    if (frequency === 'monthly') {
      for (let i = 1; i < deliveryDates.deliveryDates.length; i++) {
        const prev = deliveryDates.deliveryDates[i - 1];
        const curr = deliveryDates.deliveryDates[i];
        const gapDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        
        analysis.validation.dayGaps.push({
          from: prev.toISOString().split('T')[0],
          to: curr.toISOString().split('T')[0],
          gapDays,
          isValid: gapDays >= 1 // Should have at least 1 day gap (deliver every other day)
        });
      }
    }

    // Test next delivery calculation
    const testNextDelivery = SubscriptionManager.getNextScheduledDelivery(
      new Date(),
      frequency
    );

    return NextResponse.json({
      success: true,
      data: {
        frequency,
        duration,
        requestedStartDate: startDate,
        analysis,
        nextDeliveryTest: {
          nextDelivery: testNextDelivery.toISOString(),
          dayOfWeek: testNextDelivery.toLocaleDateString('en-US', { weekday: 'long' }),
          isValidDay: testNextDelivery.getDay() !== 0 // Should not be Sunday
        },
        summary: {
          passesValidation: !analysis.validation.hasSundayDeliveries && 
                           (frequency === 'weekly' || analysis.validation.dayGaps.every(gap => gap.isValid)),
          issues: [
            ...(analysis.validation.hasSundayDeliveries ? ['Contains Sunday deliveries'] : []),
            ...(frequency === 'monthly' ? analysis.validation.dayGaps.filter(gap => !gap.isValid).map(gap => 
              `Invalid gap: ${gap.gapDays} days between ${gap.from} and ${gap.to}`
            ) : [])
          ]
        }
      }
    });

  } catch (error) {
    console.error('Error in delivery test:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

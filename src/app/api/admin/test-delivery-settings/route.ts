import { NextResponse } from 'next/server';
import { 
  generateSubscriptionDeliveryDatesWithSettings,
  calculateNextDeliveryDateWithSettings,
  getDeliverySchedulePreview,
  clearDeliverySettingsCache
} from '@/lib/deliverySchedulerWithSettings';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionType = searchParams.get('subscriptionType') || 'juices';
    const action = searchParams.get('action') || 'preview';
    
    if (action === 'preview') {
      const startDate = new Date(searchParams.get('startDate') || new Date().toISOString());
      const previewDays = parseInt(searchParams.get('previewDays') || '14');
      
      const preview = await getDeliverySchedulePreview(subscriptionType, startDate, previewDays);
      
      return NextResponse.json({
        success: true,
        subscription_type: subscriptionType,
        start_date: startDate,
        preview_days: previewDays,
        schedule_description: preview.schedule,
        delivery_dates: preview.dates.map(date => ({
          date: date.toISOString().split('T')[0],
          formatted: date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
        }))
      });
    }
    
    if (action === 'generate') {
      const startDate = new Date(searchParams.get('startDate') || new Date().toISOString());
      const duration = parseInt(searchParams.get('duration') || '1');
      
      const deliveryDates = await generateSubscriptionDeliveryDatesWithSettings(
        subscriptionType,
        duration,
        startDate
      );
      
      return NextResponse.json({
        success: true,
        subscription_type: subscriptionType,
        duration_months: duration,
        ...deliveryDates,
        delivery_dates: deliveryDates.deliveryDates.map(date => ({
          date: date.toISOString().split('T')[0],
          formatted: date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        }))
      });
    }
    
    if (action === 'next') {
      const currentDate = new Date(searchParams.get('currentDate') || new Date().toISOString());
      
      const nextDate = await calculateNextDeliveryDateWithSettings(subscriptionType, currentDate);
      
      return NextResponse.json({
        success: true,
        subscription_type: subscriptionType,
        current_date: currentDate.toISOString().split('T')[0],
        next_delivery_date: nextDate.toISOString().split('T')[0],
        formatted_next_date: nextDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in delivery scheduler test:', error);
    return NextResponse.json({ 
      error: 'Failed to test delivery scheduler',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    if (action === 'clear-cache') {
      clearDeliverySettingsCache();
      return NextResponse.json({
        success: true,
        message: 'Delivery settings cache cleared'
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in delivery scheduler test POST:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: (error as Error).message 
    }, { status: 500 });
  }
}

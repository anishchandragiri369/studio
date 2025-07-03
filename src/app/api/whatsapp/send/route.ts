import { NextRequest, NextResponse } from 'next/server';
import { subscriptionWhatsApp } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      phoneNumber, 
      messageType, 
      customerName,
      data 
    } = body;

    if (!phoneNumber || !messageType) {
      return NextResponse.json({
        success: false,
        error: 'Phone number and message type are required'
      }, { status: 400 });
    }

    let result;

    switch (messageType) {
      case 'churn_prevention':
        result = await subscriptionWhatsApp.sendChurnPreventionMessage(
          phoneNumber, 
          customerName || 'Customer', 
          data?.churnRisk || 0
        );
        break;

      case 'pause_reminder':
        result = await subscriptionWhatsApp.sendPauseReminderMessage(
          phoneNumber,
          customerName || 'Customer',
          data?.nextDeliveryDate || 'soon'
        );
        break;

      case 'delivery_feedback':
        result = await subscriptionWhatsApp.sendDeliveryFeedbackMessage(
          phoneNumber,
          customerName || 'Customer',
          data?.deliveryId || 'unknown'
        );
        break;

      case 'seasonal_promotion':
        result = await subscriptionWhatsApp.sendSeasonalPromotionMessage(
          phoneNumber,
          customerName || 'Customer',
          data?.promotion || 'Special offer available!'
        );
        break;

      case 'order_confirmation':
        result = await subscriptionWhatsApp.sendOrderConfirmationMessage(
          phoneNumber,
          customerName || 'Customer',
          data?.orderDetails || {}
        );
        break;

      case 'payment_failure':
        result = await subscriptionWhatsApp.sendPaymentFailureMessage(
          phoneNumber,
          customerName || 'Customer',
          data?.amount || 0
        );
        break;

      case 'welcome':
        result = await subscriptionWhatsApp.sendWelcomeMessage(
          phoneNumber,
          customerName || 'Customer'
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid message type'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Test endpoint to send sample messages
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('test');
  const phoneNumber = searchParams.get('phone') || '+1234567890'; // Dummy number

  if (!testType) {
    return NextResponse.json({
      message: 'WhatsApp API Test Endpoint',
      availableTests: [
        'churn_prevention',
        'pause_reminder', 
        'delivery_feedback',
        'seasonal_promotion',
        'order_confirmation',
        'payment_failure',
        'welcome'
      ],
      usage: '/api/whatsapp/send?test=churn_prevention&phone=+1234567890'
    });
  }

  try {
    let result;

    switch (testType) {
      case 'churn_prevention':
        result = await subscriptionWhatsApp.sendChurnPreventionMessage(
          phoneNumber, 
          'John Doe', 
          75
        );
        break;

      case 'pause_reminder':
        result = await subscriptionWhatsApp.sendPauseReminderMessage(
          phoneNumber,
          'Jane Smith',
          'July 15, 2025'
        );
        break;

      case 'delivery_feedback':
        result = await subscriptionWhatsApp.sendDeliveryFeedbackMessage(
          phoneNumber,
          'Mike Johnson',
          'del_123456'
        );
        break;

      case 'seasonal_promotion':
        result = await subscriptionWhatsApp.sendSeasonalPromotionMessage(
          phoneNumber,
          'Sarah Wilson',
          'Summer Special: 25% off all citrus juices! 🍊'
        );
        break;

      case 'order_confirmation':
        result = await subscriptionWhatsApp.sendOrderConfirmationMessage(
          phoneNumber,
          'Alex Brown',
          {
            plan: 'Weekly Kickstarter',
            nextDelivery: 'July 10, 2025'
          }
        );
        break;

      case 'payment_failure':
        result = await subscriptionWhatsApp.sendPaymentFailureMessage(
          phoneNumber,
          'Emily Davis',
          2697
        );
        break;

      case 'welcome':
        result = await subscriptionWhatsApp.sendWelcomeMessage(
          phoneNumber,
          'Chris Taylor'
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      testType,
      phoneNumber
    });

  } catch (error) {
    console.error('Error in WhatsApp test:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

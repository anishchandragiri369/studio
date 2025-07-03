import { NextRequest, NextResponse } from 'next/server';
import { whatsAppService } from '@/lib/whatsapp';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Webhook verification
  if (mode === 'subscribe' && whatsAppService.verifyWebhook(token || '')) {
    console.log('WhatsApp webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Parse the incoming message
    const message = whatsAppService.parseWebhookMessage(body);
    
    if (!message) {
      console.log('No valid message found in webhook');
      return NextResponse.json({ status: 'ok' });
    }

    // Log the conversation
    await logWhatsAppMessage(message, 'inbound');

    // Process the message based on type and content
    await processIncomingMessage(message);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function logWhatsAppMessage(message: any, direction: 'inbound' | 'outbound') {
  try {
    // Find or create conversation
    let { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('whatsapp_phone_number', message.from)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!conversation) {
      // Create new conversation
      const { data: newConversation } = await supabase
        .from('whatsapp_conversations')
        .insert({
          whatsapp_phone_number: message.from,
          conversation_id: `conv_${message.from}_${Date.now()}`,
          conversation_type: 'service',
          trigger_event: 'user_initiated'
        })
        .select()
        .single();
      
      conversation = newConversation;
    }

    if (conversation) {
      // Log the message
      await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversation.id,
          whatsapp_message_id: message.id,
          direction,
          message_type: message.type,
          content: {
            text: message.text,
            interactive: message.interactive
          },
          status: 'received'
        });

      // Update conversation last message time
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: conversation.message_count + 1
        })
        .eq('id', conversation.id);
    }
  } catch (error) {
    console.error('Error logging WhatsApp message:', error);
  }
}

async function processIncomingMessage(message: any) {
  const phoneNumber = message.from;
  const messageText = message.text?.body?.toLowerCase() || '';
  const interactiveReply = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;

  try {
    // Find user by phone number (you'll need to add phone field to user profiles)
    const { data: user } = await supabase
      .from('profiles') // Assuming you have a profiles table
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    // Handle interactive button replies
    if (interactiveReply) {
      await handleInteractiveReply(phoneNumber, interactiveReply, user);
      return;
    }

    // Handle text messages
    if (messageText) {
      await handleTextMessage(phoneNumber, messageText, user);
      return;
    }

  } catch (error) {
    console.error('Error processing incoming message:', error);
    
    // Send fallback message
    await whatsAppService.sendTextMessage(
      phoneNumber,
      "Hi! Thanks for reaching out. For immediate assistance, please visit our website or call our support team. 📞"
    );
  }
}

async function handleInteractiveReply(phoneNumber: string, replyId: string, user: any) {
  const { subscriptionWhatsApp } = await import('@/lib/whatsapp');

  switch (replyId) {
    case 'feedback':
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "We'd love to hear your feedback! What can we improve about your juice subscription experience? 📝"
      );
      break;

    case 'discount':
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "Great news! Here's a special 15% discount for you: SAVE15 🎉 Use it on your next order or renewal!"
      );
      break;

    case 'pause':
      await whatsAppService.sendInteractiveButtons(phoneNumber, 
        "How long would you like to pause your subscription? ⏸️", [
        { id: 'pause_1week', title: '1 Week' },
        { id: 'pause_2weeks', title: '2 Weeks' },
        { id: 'pause_1month', title: '1 Month' },
        { id: 'pause_custom', title: 'Custom Duration' }
      ]);
      break;

    case 'continue':
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "Awesome! We're glad you're happy with your subscription. Keep enjoying those fresh juices! 🥤✨"
      );
      break;

    case 'pause_1week':
    case 'pause_2weeks':
    case 'pause_1month':
      const duration = replyId.replace('pause_', '');
      await handleSubscriptionPause(phoneNumber, duration, user);
      break;

    case 'view_order':
      await sendOrderDetails(phoneNumber, user);
      break;

    case 'modify_order':
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "To modify your order, please visit: https://yourapp.com/subscriptions/modify or reply with the changes you'd like to make! ✏️"
      );
      break;

    case 'update_payment':
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "Please update your payment method here: https://yourapp.com/payment-methods 💳 We'll retry the payment automatically!"
      );
      break;

    case 'contact_support':
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "Our support team is here to help! 📞\n\nCall: +91-9876543210\nEmail: support@yourapp.com\nHours: 9 AM - 7 PM"
      );
      break;

    default:
      // Handle rating replies
      if (replyId.startsWith('rate_')) {
        await handleDeliveryRating(phoneNumber, replyId, user);
      } else {
        await whatsAppService.sendTextMessage(
          phoneNumber,
          "Thanks for your message! For more options, visit our app or website. 🌟"
        );
      }
  }
}

async function handleTextMessage(phoneNumber: string, messageText: string, user: any) {
  // Simple keyword-based responses
  if (messageText.includes('pause') || messageText.includes('stop')) {
    await whatsAppService.sendInteractiveButtons(phoneNumber,
      "Would you like to pause your subscription? ⏸️", [
      { id: 'pause_1week', title: '1 Week' },
      { id: 'pause_2weeks', title: '2 Weeks' },
      { id: 'pause_1month', title: '1 Month' },
      { id: 'continue', title: 'No, Continue' }
    ]);
  } else if (messageText.includes('help') || messageText.includes('support')) {
    await whatsAppService.sendInteractiveButtons(phoneNumber,
      "How can we help you today? 🤝", [
      { id: 'view_order', title: '📋 View My Order' },
      { id: 'modify_order', title: '✏️ Modify Order' },
      { id: 'update_payment', title: '💳 Payment Issues' },
      { id: 'contact_support', title: '📞 Talk to Human' }
    ]);
  } else if (messageText.includes('delivery') || messageText.includes('when')) {
    await sendDeliveryInfo(phoneNumber, user);
  } else {
    // Default response
    await whatsAppService.sendTextMessage(
      phoneNumber,
      "Hi! I'm your juice subscription assistant. Reply 'help' for options or visit our app for more features! 🥤"
    );
  }
}

async function handleSubscriptionPause(phoneNumber: string, duration: string, user: any) {
  try {
    // Here you would actually pause the subscription in your database
    // For now, just send confirmation
    
    const durationMap: { [key: string]: string } = {
      '1week': '1 week',
      '2weeks': '2 weeks', 
      '1month': '1 month'
    };

    await whatsAppService.sendTextMessage(
      phoneNumber,
      `✅ Your subscription has been paused for ${durationMap[duration]}. You can resume anytime from the app or by replying 'resume'. Take care! 🌟`
    );

    // Log the pause action
    if (user) {
      await supabase.from('subscription_actions').insert({
        user_id: user.id,
        action_type: 'pause',
        action_details: { duration, source: 'whatsapp' },
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error handling subscription pause:', error);
    await whatsAppService.sendTextMessage(
      phoneNumber,
      "Sorry, there was an issue pausing your subscription. Please try again or contact support. 📞"
    );
  }
}

async function handleDeliveryRating(phoneNumber: string, ratingId: string, user: any) {
  const [, rating, deliveryId] = ratingId.split('_');
  
  try {
    // Save rating to database
    if (user && deliveryId) {
      await supabase.from('delivery_ratings').insert({
        user_id: user.id,
        delivery_id: deliveryId,
        rating: rating === 'low' ? 2 : parseInt(rating),
        source: 'whatsapp',
        created_at: new Date().toISOString()
      });
    }

    if (rating === 'low' || parseInt(rating) <= 3) {
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "We're sorry your delivery wasn't perfect! 😔 Our team will contact you soon to make it right. Your feedback helps us improve! 🌟"
      );
    } else {
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "Thank you for the great rating! 🌟 We're so happy you enjoyed your juices. Keep staying healthy! 🥤💪"
      );
    }
  } catch (error) {
    console.error('Error handling delivery rating:', error);
  }
}

async function sendOrderDetails(phoneNumber: string, user: any) {
  try {
    if (!user) {
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "Please log in to your account to view order details: https://yourapp.com/login 📱"
      );
      return;
    }

    // Fetch user's active subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subscription) {
      const message = `📋 Your Current Subscription:
      
Plan: ${subscription.plan_type}
Status: ${subscription.status}
Next Delivery: ${subscription.next_delivery_date}
Frequency: ${subscription.frequency}

Visit the app for more details! 🥤`;

      await whatsAppService.sendTextMessage(phoneNumber, message);
    } else {
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "You don't have an active subscription. Start your fresh juice journey today! 🌟"
      );
    }
  } catch (error) {
    console.error('Error sending order details:', error);
    await whatsAppService.sendTextMessage(
      phoneNumber,
      "Unable to fetch order details right now. Please check the app or contact support. 📱"
    );
  }
}

async function sendDeliveryInfo(phoneNumber: string, user: any) {
  try {
    if (!user) {
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "For delivery information, please log in to your account: https://yourapp.com/login 📱"
      );
      return;
    }

    // Get next delivery info
    const { data: nextDelivery } = await supabase
      .from('subscription_deliveries')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .order('delivery_date', { ascending: true })
      .limit(1)
      .single();

    if (nextDelivery) {
      const deliveryDate = new Date(nextDelivery.delivery_date).toLocaleDateString();
      await whatsAppService.sendTextMessage(
        phoneNumber,
        `🚚 Your next delivery is scheduled for ${deliveryDate}. We'll send you tracking details on the delivery day! 📦`
      );
    } else {
      await whatsAppService.sendTextMessage(
        phoneNumber,
        "No upcoming deliveries scheduled. Check your subscription status in the app! 📱"
      );
    }
  } catch (error) {
    console.error('Error sending delivery info:', error);
    await whatsAppService.sendTextMessage(
      phoneNumber,
      "Unable to fetch delivery information right now. Please check the app! 📱"
    );
  }
}

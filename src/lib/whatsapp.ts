// WhatsApp Business API Integration
// Using dummy credentials - replace with real ones in production

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
  baseUrl: string;
}

// WhatsApp Business API Configuration
// Uses environment variables for production, falls back to dummy values for development
const WHATSAPP_CONFIG: WhatsAppConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'DUMMY_ACCESS_TOKEN_REPLACE_WITH_REAL',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'DUMMY_PHONE_NUMBER_ID_123456789',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'DUMMY_BUSINESS_ACCOUNT_ID_987654321',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'DUMMY_WEBHOOK_VERIFY_TOKEN_ABC123',
  apiVersion: 'v17.0',
  baseUrl: 'https://graph.facebook.com'
};

// Helper function to check if WhatsApp is configured with real credentials
export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN && 
    process.env.WHATSAPP_PHONE_NUMBER_ID && 
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID && 
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    !process.env.WHATSAPP_ACCESS_TOKEN.includes('DUMMY')
  );
}

// Get configuration status for admin dashboard
export function getWhatsAppConfigStatus() {
  const isDummy = !isWhatsAppConfigured();
  return {
    configured: !isDummy,
    accessToken: isDummy ? 'DUMMY_*****' : 'REAL_*****',
    phoneNumberId: isDummy ? 'DUMMY_*****' : 'REAL_*****',
    businessAccountId: isDummy ? 'DUMMY_*****' : 'REAL_*****',
    webhookVerifyToken: isDummy ? 'DUMMY_*****' : 'REAL_*****',
    apiVersion: WHATSAPP_CONFIG.apiVersion,
    status: isDummy ? 'Using dummy credentials' : 'Production ready'
  };
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
  interactive?: {
    type: 'button' | 'list';
    body: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  interactive?: {
    type: string;
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
    };
  };
}

class WhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig = WHATSAPP_CONFIG) {
    this.config = config;
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if using dummy credentials
      if (!isWhatsAppConfigured()) {
        console.warn('⚠️ WhatsApp: Using dummy credentials. Message will not be sent to real WhatsApp API.');
        return {
          success: true,
          messageId: `dummy_msg_${Date.now()}`,
          error: undefined
        };
      }

      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API Error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || 'Failed to send message'
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages[0]?.id
      };
    } catch (error) {
      console.error('WhatsApp Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async sendTextMessage(phoneNumber: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'text',
      text: { body: text }
    });
  }

  async sendTemplateMessage(
    phoneNumber: string, 
    templateName: string, 
    languageCode: string = 'en',
    parameters: Array<{ type: string; text: string }> = []
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: parameters.length > 0 ? [{
          type: 'body',
          parameters
        }] : undefined
      }
    });
  }

  async sendInteractiveButtons(
    phoneNumber: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply' as const,
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    });
  }

  async sendInteractiveList(
    phoneNumber: string,
    bodyText: string,
    sections: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: { sections }
      }
    });
  }

  verifyWebhook(token: string): boolean {
    return token === this.config.webhookVerifyToken;
  }

  parseWebhookMessage(webhookData: any): WhatsAppWebhookMessage | null {
    try {
      const entry = webhookData.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];

      if (!message) return null;

      return {
        from: message.from,
        id: message.id,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text,
        interactive: message.interactive
      };
    } catch (error) {
      console.error('Error parsing webhook message:', error);
      return null;
    }
  }
}

// Subscription-specific WhatsApp messages
export class SubscriptionWhatsAppMessages {
  private whatsApp: WhatsAppService;

  constructor() {
    this.whatsApp = new WhatsAppService();
  }

  // Churn prevention message
  async sendChurnPreventionMessage(phoneNumber: string, customerName: string, churnRisk: number) {
    const message = `Hi ${customerName}! 👋 We've noticed you might be considering pausing your juice subscription. Is everything okay? We'd love to help make your experience better! 🥤✨`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: 'feedback', title: '💬 Give Feedback' },
      { id: 'discount', title: '🎯 Get Discount' },
      { id: 'pause', title: '⏸️ Pause Subscription' },
      { id: 'continue', title: '✅ All Good' }
    ]);
  }

  // Pause reminder message
  async sendPauseReminderMessage(phoneNumber: string, customerName: string, nextDeliveryDate: string) {
    const message = `Hey ${customerName}! 📅 Your next juice delivery is scheduled for ${nextDeliveryDate}. Going somewhere? You can pause by 6 PM today to skip next week's delivery.`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: 'pause_1week', title: '⏸️ Pause 1 Week' },
      { id: 'pause_2weeks', title: '⏸️ Pause 2 Weeks' },
      { id: 'pause_custom', title: '📅 Custom Pause' },
      { id: 'continue_delivery', title: '✅ Continue' }
    ]);
  }

  // Delivery feedback request
  async sendDeliveryFeedbackMessage(phoneNumber: string, customerName: string, deliveryId: string) {
    const message = `Hi ${customerName}! 🚚 How was your juice delivery today? Your feedback helps us improve! 🌟`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: `rate_5_${deliveryId}`, title: '⭐⭐⭐⭐⭐ Excellent' },
      { id: `rate_4_${deliveryId}`, title: '⭐⭐⭐⭐ Good' },
      { id: `rate_3_${deliveryId}`, title: '⭐⭐⭐ Okay' },
      { id: `rate_low_${deliveryId}`, title: '😞 Not Great' }
    ]);
  }

  // Seasonal promotion message
  async sendSeasonalPromotionMessage(phoneNumber: string, customerName: string, promotion: string) {
    const message = `🌟 Hey ${customerName}! ${promotion} Limited time offer - don't miss out! 🥤`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: 'view_offer', title: '👀 View Offer' },
      { id: 'add_to_subscription', title: '➕ Add to Subscription' },
      { id: 'remind_later', title: '⏰ Remind Later' },
      { id: 'not_interested', title: '❌ Not Interested' }
    ]);
  }

  // Order confirmation message
  async sendOrderConfirmationMessage(phoneNumber: string, customerName: string, orderDetails: any) {
    const message = `✅ Order confirmed, ${customerName}! Your ${orderDetails.plan} subscription is active. Next delivery: ${orderDetails.nextDelivery} 🥤📦`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: 'view_order', title: '📋 View Details' },
      { id: 'modify_order', title: '✏️ Modify Order' },
      { id: 'delivery_instructions', title: '📝 Add Instructions' },
      { id: 'track_delivery', title: '📍 Track Delivery' }
    ]);
  }

  // Payment failure notification
  async sendPaymentFailureMessage(phoneNumber: string, customerName: string, amount: number) {
    const message = `💳 Hi ${customerName}, we couldn't process your payment of ₹${amount}. Please update your payment method to continue your subscription.`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: 'update_payment', title: '💳 Update Payment' },
      { id: 'retry_payment', title: '🔄 Retry Payment' },
      { id: 'pause_subscription', title: '⏸️ Pause Subscription' },
      { id: 'contact_support', title: '📞 Contact Support' }
    ]);
  }

  // Welcome message for new subscribers
  async sendWelcomeMessage(phoneNumber: string, customerName: string) {
    const message = `🎉 Welcome to the family, ${customerName}! Your fresh juice journey starts now. We're here to make every sip amazing! 🥤✨`;
    
    return this.whatsApp.sendInteractiveButtons(phoneNumber, message, [
      { id: 'customize_juices', title: '🎨 Customize Juices' },
      { id: 'delivery_preferences', title: '📅 Set Delivery Times' },
      { id: 'family_sharing', title: '👨‍👩‍👧‍👦 Family Sharing' },
      { id: 'help_support', title: '❓ Need Help?' }
    ]);
  }
}

export const whatsAppService = new WhatsAppService();
export const subscriptionWhatsApp = new SubscriptionWhatsAppMessages();

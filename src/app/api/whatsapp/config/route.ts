import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfigStatus } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const configStatus = getWhatsAppConfigStatus();
    
    return NextResponse.json(configStatus);
  } catch (error) {
    console.error('Error getting WhatsApp config status:', error);
    return NextResponse.json({
      configured: false,
      accessToken: 'ERROR_*****',
      phoneNumberId: 'ERROR_*****',
      businessAccountId: 'ERROR_*****',
      webhookVerifyToken: 'ERROR_*****',
      apiVersion: 'v17.0',
      status: 'Configuration error'
    });
  }
}

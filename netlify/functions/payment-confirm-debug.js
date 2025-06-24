// Debug version to identify the 500 error
exports.handler = async (event) => {
  try {
    console.log('=== DEBUG WEBHOOK START ===');
    console.log('Event method:', event.httpMethod);
    console.log('Event headers:', JSON.stringify(event.headers, null, 2));
    console.log('Event body length:', event.body?.length || 0);
    
    // Test basic dependencies
    console.log('Testing crypto...');
    const crypto = require('crypto');
    console.log('Crypto loaded successfully');
    
    console.log('Testing nodemailer...');
    const nodemailer = require('nodemailer');
    console.log('Nodemailer loaded successfully');
    
    console.log('Testing supabase...');
    const { createClient } = require('@supabase/supabase-js');
    console.log('Supabase loaded successfully');
    
    // Test environment variables
    console.log('Environment variables check:');
    console.log('SUPABASE_URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    console.log('CASHFREE_SECRET present:', !!process.env.CASHFREE_SECRET_KEY);
    console.log('GMAIL_USER present:', !!process.env.GMAIL_USER);
    
    // Try to parse the body
    if (event.body) {
      console.log('Parsing body...');
      const webhookData = JSON.parse(event.body);
      console.log('Body parsed successfully:', typeof webhookData);
    }
    
    console.log('=== DEBUG WEBHOOK END ===');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Debug webhook working',
        timestamp: new Date().toISOString()
      }),
    };
    
  } catch (error) {
    console.error('=== DEBUG ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
    };
  }
};

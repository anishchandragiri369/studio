/**
 * Debug endpoint to check environment variables and email configuration
 */

export async function GET() {
  try {
    const config = {
      // Public env vars (safe to expose)
      NEXT_PUBLIC_CUSTOM_AUTH_EMAILS: process.env.NEXT_PUBLIC_CUSTOM_AUTH_EMAILS,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      
      // Server-only env vars (don't expose values, just check existence)
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      GMAIL_USER: process.env.GMAIL_USER ? '✅ Set' : '❌ Missing',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing',
      EMAIL_MOCK_MODE: process.env.EMAIL_MOCK_MODE,
      
      // System info
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    console.log('[DebugConfig] Environment check:', config);

    return Response.json(config);

  } catch (error) {
    console.error('[DebugConfig] Error:', error);
    return Response.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

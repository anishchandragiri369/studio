import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    console.log('[activate] Activation request received for:', email);

    if (!token || !email) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Activation Link</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Invalid Activation Link</h1>
          <p>The activation link is missing required parameters.</p>
          <p><a href="/">Return to Home</a></p>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    try {
      // Check if activation token is valid and not expired
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('user_activation_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', email)
        .eq('used', false)
        .single();

      if (tokenError || !tokenData) {
        console.log('[activate] Invalid or used token:', tokenError?.message);
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invalid or Expired Link</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Activation Link Invalid</h1>
            <p>This activation link has expired or has already been used.</p>
            <p>Please request a new activation email or contact support.</p>
            <p><a href="/">Return to Home</a></p>
          </body>
          </html>
        `, {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        console.log('[activate] Token expired');
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Link Expired</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1 class="error">⏰ Activation Link Expired</h1>
            <p>This activation link has expired for security reasons.</p>
            <p>Please request a new activation email.</p>
            <p><a href="/signup">Sign Up Again</a> | <a href="/">Return to Home</a></p>
          </body>
          </html>
        `, {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Activate the user using admin client
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        tokenData.user_id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.error('[activate] Failed to confirm user:', confirmError);
        return new NextResponse(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Activation Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Activation Failed</h1>
            <p>There was an error activating your account. Please try again or contact support.</p>
            <p><a href="/">Return to Home</a></p>
          </body>
          </html>
        `, {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Mark token as used
      await supabaseAdmin
        .from('user_activation_tokens')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('token', token);

      console.log('[activate] User activated successfully:', email);

      // Send welcome email now that user is activated
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/send-welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email, 
            name: email.split('@')[0] 
          }),
        });
        console.log('[activate] Welcome email sent after activation');
      } catch (welcomeError) {
        console.warn('[activate] Failed to send welcome email:', welcomeError);
      }

      // Return success page with redirect to login page
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
      const loginUrl = `${baseUrl}/login`;
      
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Account Activated!</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
            }
            .container { 
              background: white; 
              color: #333; 
              padding: 40px; 
              border-radius: 15px; 
              max-width: 500px; 
              margin: 0 auto;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .success { color: #28a745; font-size: 48px; margin-bottom: 20px; }
            .login-button { 
              display: inline-block;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 50px; 
              font-weight: bold; 
              margin: 20px 0;
              font-size: 16px;
            }
            .login-button:hover {
              background: linear-gradient(135deg, #218838 0%, #1ba085 100%);
            }
            .countdown { color: #6c757d; font-size: 14px; margin-top: 20px; }
          </style>
          <script>
            let countdown = 5;
            function updateCountdown() {
              document.getElementById('countdown').textContent = countdown;
              countdown--;
              if (countdown < 0) {
                window.location.href = '${loginUrl}';
              }
            }
            setInterval(updateCountdown, 1000);
          </script>
        </head>
        <body>
          <div class="container">
            <div class="success">🎉</div>
            <h1>Account Activated Successfully!</h1>
            <p>Welcome to Elixr! Your account has been activated and you can now log in to start exploring our premium juice collection.</p>
            <p>A welcome email with all the details has been sent to your inbox.</p>
            <a href="${loginUrl}" class="login-button">🔐 Go to Login</a>
            <div class="countdown">
              Redirecting to login page in <span id="countdown">5</span> seconds...
            </div>
          </div>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });

    } catch (dbError) {
      console.error('[activate] Database error:', dbError);
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Activation Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Database Error</h1>
          <p>There was an error processing your activation. Please try again or contact support.</p>
          <p><a href="/">Return to Home</a></p>
        </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }

  } catch (error) {
    console.error('[activate] Activation error:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Activation Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; }
        </style>
      </head>
      <body>
        <h1 class="error">❌ Activation Error</h1>
        <p>An unexpected error occurred during activation. Please try again or contact support.</p>
        <p><a href="/">Return to Home</a></p>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

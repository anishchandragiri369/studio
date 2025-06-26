import 'dotenv/config'; // Ensures .env variables are loaded
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

async function sendTestEmail() {
  // Log environment variables to help debug
  console.log("GMAIL_USER:", process.env.GMAIL_USER);
  console.log("GMAIL_CLIENT_ID:", process.env.GMAIL_CLIENT_ID);
  console.log("GMAIL_CLIENT_SECRET:", process.env.GMAIL_CLIENT_SECRET);
  console.log("GMAIL_REFRESH_TOKEN:", process.env.GMAIL_REFRESH_TOKEN);
  console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);

  if (!process.env.GMAIL_USER || !process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN || !process.env.ADMIN_EMAIL) {
    console.error("Error: One or more required environment variables are missing. Please check your .env file.");
    return;
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Standard redirect URI for playground
  );

  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    if (!accessToken) {
      console.error("Error: Failed to retrieve access token. Check your OAuth2 credentials and refresh token.");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: false, // IMPORTANT: For local development only to bypass self-signed certificate errors. Remove for production.
      },
    });

    const mailOptions = {
      from: `"Elixr Test" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email from Elixr App',
      text: 'This is a test email sent from your Elixr application setup.',
      html: '<p>This is a <b>test email</b> sent from your Elixr application setup.</p>',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully! Message ID:', info.messageId);

  } catch (error) {
    console.error('Error sending test email:', error);
    // Log more details if it's an OAuth error
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as any).response?.data
    ) {
      console.error('OAuth Error Details:', (error as any).response.data);
    }
  }
}

sendTestEmail();

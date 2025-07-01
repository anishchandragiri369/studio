const { google } = require('googleapis');
const readline = require('readline');

// Your existing OAuth credentials from .env
const CLIENT_ID = '1031348146704-109v1ngpe8pbc346d1ckan28al8bspud.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Gmail send scope
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Generate the authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Force consent to get refresh token
});

console.log('='.repeat(80));
console.log('GMAIL OAUTH REFRESH TOKEN GENERATOR');
console.log('='.repeat(80));
console.log('\n1. Open this URL in your browser and sign in with anishchandragiri@gmail.com:');
console.log('\n' + authUrl + '\n');
console.log('2. After authorization, you will be redirected to a page with a code.');
console.log('3. Copy that authorization code and paste it below.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n' + '='.repeat(80));
    console.log('SUCCESS! Here is your new refresh token:');
    console.log('='.repeat(80));
    console.log('\nCopy this refresh token to your .env file:');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    
    if (tokens.refresh_token) {
      console.log('✅ Refresh token generated successfully!');
      console.log('✅ Update your .env file with the new token');
      console.log('✅ Restart your Next.js server');
      console.log('✅ Test password reset - you should receive real emails now!\n');
    } else {
      console.log('⚠️  No refresh token received. Make sure you:');
      console.log('   - Used the correct Google account (anishchandragiri@gmail.com)');
      console.log('   - Granted all permissions');
      console.log('   - Are generating a new token (not reusing old authorization)\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
    console.log('\nTry the process again or use Google OAuth Playground instead.');
  }
  
  rl.close();
});

console.log('Waiting for authorization code...');

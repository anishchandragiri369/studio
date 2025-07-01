// Google OAuth2 service for custom authentication
import { google } from 'googleapis';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUserInfo;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
}

export class GoogleAuthService {
  private static oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  );

  /**
   * Generate Google OAuth URL for sign-in
   */
  static getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
      include_granted_scopes: true,
    });
  }

  /**
   * Exchange authorization code for tokens and user info
   */
  static async exchangeCodeForTokens(code: string): Promise<GoogleAuthResult> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        return { success: false, error: 'No access token received' };
      }

      // Set credentials
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!userInfo.data) {
        return { success: false, error: 'Failed to get user information' };
      }

      return {
        success: true,
        user: userInfo.data as GoogleUserInfo,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
      };
    } catch (error) {
      console.error('[GoogleAuthService] Token exchange error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * Verify and refresh access token
   */
  static async verifyAccessToken(accessToken: string): Promise<GoogleUserInfo | null> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      return userInfo.data as GoogleUserInfo;
    } catch (error) {
      console.error('[GoogleAuthService] Token verification error:', error);
      return null;
    }
  }

  /**
   * Client-side Google Sign-In (for frontend)
   */
  static initializeGoogleSignIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Sign-In can only be initialized in browser'));
        return;
      }

      // Load Google Sign-In script if not already loaded
      if (!(window as any).google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  /**
   * Trigger Google Sign-In popup
   */
  static async signInWithPopup(): Promise<GoogleAuthResult> {
    try {
      await this.initializeGoogleSignIn();
      
      return new Promise((resolve) => {
        if (typeof window === 'undefined') {
          resolve({ success: false, error: 'Not in browser environment' });
          return;
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
        
        if (!clientId) {
          resolve({ success: false, error: 'Google Client ID not configured' });
          return;
        }

        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              // Decode JWT token to get user info
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              
              const user: GoogleUserInfo = {
                id: payload.sub,
                email: payload.email,
                verified_email: payload.email_verified,
                name: payload.name,
                given_name: payload.given_name,
                family_name: payload.family_name,
                picture: payload.picture,
                locale: payload.locale || 'en',
              };

              resolve({
                success: true,
                user,
                accessToken: response.credential, // JWT token
              });
            } catch (error) {
              resolve({ 
                success: false, 
                error: 'Failed to parse Google response' 
              });
            }
          },
        });

        (window as any).google.accounts.id.prompt(); // Show One Tap
      });
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Google Sign-In failed' 
      };
    }
  }

  /**
   * Render Google Sign-In button
   */
  static renderSignInButton(elementId: string, options?: {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  }): void {
    if (typeof window === 'undefined') return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
    
    if (!clientId) {
      console.error('[GoogleAuthService] Google Client ID not configured');
      return;
    }

    this.initializeGoogleSignIn().then(() => {
      (window as any).google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: options?.theme || 'outline',
          size: options?.size || 'large',
          text: options?.text || 'signin_with',
          shape: options?.shape || 'rectangular',
        }
      );
    });
  }
}

export default GoogleAuthService;

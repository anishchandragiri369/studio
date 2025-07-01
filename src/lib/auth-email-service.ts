// Auth email helper utility
interface AuthEmailOptions {
  email: string;
  name?: string;
  resetLink?: string;
  confirmationLink?: string;
}

export class AuthEmailService {
  private static baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

  /**
   * Send welcome email after successful signup
   */
  static async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('[AuthEmailService] Welcome email failed:', result);
        return false;
      }

      console.log('[AuthEmailService] Welcome email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('[AuthEmailService] Welcome email error:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    try {
      console.log('[AuthEmailService] Sending password reset email to:', email);
      console.log('[AuthEmailService] Reset link:', resetLink);

      // Use SMTP endpoint instead of OAuth endpoint for better reliability
      const endpoint = `${this.baseUrl}/api/auth/send-reset-password-email-smtp`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetLink }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('[AuthEmailService] Failed to parse response JSON:', jsonError);
        const text = await response.text();
        console.error('[AuthEmailService] Response text:', text);
        return false;
      }
      
      if (!response.ok) {
        console.error('[AuthEmailService] Password reset email failed:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        return false;
      }

      console.log('[AuthEmailService] Password reset email sent successfully:', result);
      return true;
    } catch (error) {
      // Improved error logging to prevent empty object logs
      const errorInfo = {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        raw: error
      };
      
      console.error('[AuthEmailService] Password reset email error:', errorInfo);
      return false;
    }
  }

  /**
   * Send activation email for new user accounts
   */
  static async sendActivationEmail(email: string, userId: string, name?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/send-activation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, name }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('[AuthEmailService] Activation email failed:', result);
        return false;
      }

      console.log('[AuthEmailService] Activation email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('[AuthEmailService] Activation email error:', error);
      return false;
    }
  }

  /**
   * Send email verification
   */
  static async sendEmailVerification(email: string, confirmationLink: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, confirmationLink }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('[AuthEmailService] Email verification failed:', result);
        return false;
      }

      console.log('[AuthEmailService] Email verification sent successfully:', result);
      return true;
    } catch (error) {
      console.error('[AuthEmailService] Email verification error:', error);
      return false;
    }
  }

  /**
   * Generate reset password link with token
   */
  static generateResetLink(token: string): string {
    return `${this.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  }

  /**
   * Generate email confirmation link with token
   */
  static generateConfirmationLink(token: string): string {
    return `${this.baseUrl}/auth/confirm?token=${encodeURIComponent(token)}`;
  }
}

export default AuthEmailService;

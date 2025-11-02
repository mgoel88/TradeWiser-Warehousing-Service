import { storage } from '../storage';

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class OTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean phone number to Indian format
   */
  private cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Indian number formats
    if (cleaned.length === 10 && cleaned.match(/^[6-9]/)) {
      cleaned = '91' + cleaned; // Add country code
    } else if (cleaned.length === 13 && cleaned.startsWith('91')) {
      // Already has country code
    } else if (cleaned.length === 10) {
      // For testing/demo purposes, accept any 10-digit number
      cleaned = '91' + cleaned;
    } else {
      throw new Error('Invalid phone number format');
    }
    
    return cleaned;
  }

  /**
   * Send OTP via SMS (simulated in development)
   */
  private async sendSMS(phone: string, otp: string): Promise<SMSResponse> {
    const message = `🌾 TradeWiser OTP: ${otp}\n\nYour verification code for secure access to agricultural commodity platform.\n\nValid for 5 minutes. Do not share.`;

    // Development mode - log OTP instead of sending SMS
    console.log(`\n📱 SMS to ${phone}: ${message}\n`);
    console.log(`🔑 OTP for testing: ${otp}`);
    
    return { success: true, messageId: `dev_${Date.now()}` };
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phone: string, purpose: 'login' | 'registration' | 'password_reset' = 'login'): Promise<{
    success: boolean;
    message: string;
    otpId?: number;
  }> {
    try {
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      // Generate OTP
      const otp = this.generateOTP();
      
      // Store OTP in memory storage
      await storage.storeOTP(cleanPhone, otp, purpose, this.OTP_EXPIRY_MINUTES);

      // Send SMS (simulated in development)
      const smsResult = await this.sendSMS(cleanPhone, otp);
      
      if (!smsResult.success) {
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.'
        };
      }

      return {
        success: true,
        message: `OTP sent successfully to ${phone}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`,
        otpId: 1 // Dummy ID for compatibility
      };

    } catch (error) {
      console.error('OTP sending error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send OTP'
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string, purpose: 'login' | 'registration' | 'password_reset' = 'login'): Promise<{
    success: boolean;
    message: string;
    isValid: boolean;
  }> {
    try {
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      const isValid = await storage.verifyOTP(cleanPhone, otp, purpose);
      
      if (isValid) {
        return {
          success: true,
          isValid: true,
          message: 'OTP verified successfully'
        };
      } else {
        return {
          success: false,
          isValid: false,
          message: 'Invalid or expired OTP'
        };
      }

    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        isValid: false,
        message: 'OTP verification failed'
      };
    }
  }

  /**
   * Cleanup expired OTPs
   */
  async cleanup(): Promise<void> {
    try {
      await storage.cleanupExpiredOTPs();
    } catch (error) {
      console.error('OTP cleanup error:', error);
    }
  }
}

// Export singleton instance
export const otpService = new OTPService();
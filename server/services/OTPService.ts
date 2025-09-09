import crypto from 'crypto';
import { otpVerifications } from '@shared/schema';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';

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
    } else {
      throw new Error('Invalid Indian phone number format');
    }
    
    return cleaned;
  }

  /**
   * Send OTP via SMS
   */
  private async sendSMS(phone: string, otp: string): Promise<SMSResponse> {
    const message = `🌾 TradeWiser OTP: ${otp}\n\nYour verification code for secure access to agricultural commodity platform.\n\nValid for 5 minutes. Do not share.`;

    if (process.env.NODE_ENV === 'development') {
      // Development mode - log OTP instead of sending SMS
      console.log(`\n📱 SMS to ${phone}: ${message}\n`);
      return { success: true, messageId: `dev_${Date.now()}` };
    }

    try {
      // Production SMS using MSG91 or Twilio
      if (process.env.MSG91_API_KEY) {
        return await this.sendViaMSG91(phone, message);
      } else if (process.env.TWILIO_ACCOUNT_SID) {
        return await this.sendViaTwilio(phone, message);
      } else {
        console.log(`📱 SMS (no provider): ${phone} -> ${otp}`);
        return { success: true, messageId: `mock_${Date.now()}` };
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send SMS via MSG91
   */
  private async sendViaMSG91(phone: string, message: string): Promise<SMSResponse> {
    const response = await fetch('https://api.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_API_KEY!
      },
      body: JSON.stringify({
        mobile: phone,
        message,
        sender: 'TRDWSR',
        route: '4',
        country: '91'
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      messageId: data.request_id,
      error: data.message
    };
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(phone: string, message: string): Promise<SMSResponse> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(accountSid + ':' + authToken).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: `+${phone}`,
        Body: message
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      messageId: data.sid,
      error: data.message
    };
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
      
      // Check rate limiting - max 3 attempts per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAttempts = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.phone, cleanPhone),
            gt(otpVerifications.createdAt, oneHourAgo)
          )
        );

      if (recentAttempts.length >= 3) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again after 1 hour.'
        };
      }

      // Generate OTP and expiry
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP in database
      const [otpRecord] = await db
        .insert(otpVerifications)
        .values({
          phone: cleanPhone,
          otp,
          purpose,
          expiresAt
        })
        .returning();

      // Send SMS
      const smsResult = await this.sendSMS(cleanPhone, otp);
      
      if (!smsResult.success) {
        return {
          success: false,
          message: `Failed to send OTP: ${smsResult.error}`
        };
      }

      return {
        success: true,
        message: `OTP sent successfully to +${cleanPhone}`,
        otpId: otpRecord.id
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
  async verifyOTP(phone: string, otp: string, purpose: string = 'login'): Promise<{
    success: boolean;
    message: string;
    otpId?: number;
  }> {
    try {
      const cleanPhone = this.cleanPhoneNumber(phone);
      
      // Find valid OTP
      const [otpRecord] = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.phone, cleanPhone),
            eq(otpVerifications.otp, otp),
            eq(otpVerifications.purpose, purpose),
            eq(otpVerifications.isUsed, false),
            gt(otpVerifications.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!otpRecord) {
        // Increment attempts for rate limiting
        await db
          .update(otpVerifications)
          .set({ 
            attempts: crypto.randomInt(1, 4) // Increment attempts
          })
          .where(
            and(
              eq(otpVerifications.phone, cleanPhone),
              eq(otpVerifications.purpose, purpose),
              eq(otpVerifications.isUsed, false)
            )
          );

        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check attempts limit
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        return {
          success: false,
          message: 'Maximum verification attempts exceeded'
        };
      }

      // Mark OTP as used
      await db
        .update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, otpRecord.id));

      return {
        success: true,
        message: 'OTP verified successfully',
        otpId: otpRecord.id
      };

    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'OTP verification failed'
      };
    }
  }

  /**
   * Clean up expired OTPs (should be called periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(
        and(
          gt(new Date(), otpVerifications.expiresAt),
          eq(otpVerifications.isUsed, true)
        )
      );
  }
}

export const otpService = new OTPService();
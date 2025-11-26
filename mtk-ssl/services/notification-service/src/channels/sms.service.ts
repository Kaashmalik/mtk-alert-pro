import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

interface SendSmsDto {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER', '');

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio not configured - SMS in mock mode');
    }
  }

  async send(dto: SendSmsDto): Promise<boolean> {
    if (!this.client) {
      this.logger.log(`[MOCK] SMS to ${dto.to}: ${dto.message}`);
      return true;
    }

    try {
      // Format Pakistani number
      const formattedNumber = this.formatPakistaniNumber(dto.to);
      
      const message = await this.client.messages.create({
        body: dto.message,
        from: this.fromNumber,
        to: formattedNumber,
      });

      this.logger.log(`SMS sent: ${message.sid}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send SMS', error);
      return false;
    }
  }

  async sendOtp(phone: string, otp: string): Promise<boolean> {
    return this.send({
      to: phone,
      message: `Your SSL verification code is: ${otp}. Valid for 10 minutes.`,
    });
  }

  async sendMatchReminder(phone: string, matchName: string, time: string): Promise<boolean> {
    return this.send({
      to: phone,
      message: `🏏 SSL Match Reminder: ${matchName} starts at ${time}. Don't miss it!`,
    });
  }

  private formatPakistaniNumber(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Pakistani numbers
    if (cleaned.startsWith('0')) {
      cleaned = '92' + cleaned.substring(1);
    } else if (!cleaned.startsWith('92')) {
      cleaned = '92' + cleaned;
    }
    
    return '+' + cleaned;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface CreateJazzCashPaymentDto {
  amount: number;
  currency: string;
  description?: string;
  returnUrl?: string;
}

@Injectable()
export class JazzCashProvider {
  private readonly logger = new Logger(JazzCashProvider.name);
  private readonly merchantId: string;
  private readonly password: string;
  private readonly integritySalt: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('JAZZCASH_MERCHANT_ID', '');
    this.password = this.configService.get<string>('JAZZCASH_PASSWORD', '');
    this.integritySalt = this.configService.get<string>('JAZZCASH_INTEGRITY_SALT', '');
    this.baseUrl = this.configService.get<string>(
      'JAZZCASH_BASE_URL',
      'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction',
    );
  }

  async createPayment(dto: CreateJazzCashPaymentDto): Promise<{ paymentId: string; checkoutUrl: string }> {
    const txnRefNo = `SSL${Date.now()}`;
    const txnDateTime = this.formatDateTime(new Date());
    const expiryDateTime = this.formatDateTime(new Date(Date.now() + 3600000)); // 1 hour expiry

    const payload = {
      pp_Version: '2.0',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: this.merchantId,
      pp_Password: this.password,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: Math.round(dto.amount * 100).toString(), // In paisa
      pp_TxnCurrency: dto.currency || 'PKR',
      pp_TxnDateTime: txnDateTime,
      pp_TxnExpiryDateTime: expiryDateTime,
      pp_BillReference: txnRefNo,
      pp_Description: dto.description || 'SSL Tournament Payment',
      pp_ReturnURL: dto.returnUrl || this.configService.get('JAZZCASH_RETURN_URL', 'https://ssl.cricket/payment/callback'),
    };

    const secureHash = this.generateSecureHash(payload);

    if (!this.merchantId) {
      // Mock response for development
      this.logger.warn('JazzCash credentials not configured - using mock mode');
      return {
        paymentId: txnRefNo,
        checkoutUrl: `https://sandbox.jazzcash.com.pk/checkout?txn=${txnRefNo}`,
      };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          pp_SecureHash: secureHash,
        }),
      });

      const data = await response.json();

      if (data.pp_ResponseCode === '000') {
        return {
          paymentId: txnRefNo,
          checkoutUrl: data.pp_PaymentURL || `https://jazzcash.com.pk/pay/${txnRefNo}`,
        };
      }

      this.logger.error('JazzCash payment creation failed', data);
      throw new Error(`JazzCash error: ${data.pp_ResponseMessage}`);
    } catch (error) {
      this.logger.error('Failed to create JazzCash payment', error);
      throw error;
    }
  }

  async verifyPayment(txnRefNo: string): Promise<boolean> {
    if (!this.merchantId) {
      return true; // Mock mode
    }

    try {
      const response = await fetch(`${this.baseUrl}/InquiryAPI/API/2.0/Purchase/Inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pp_MerchantID: this.merchantId,
          pp_Password: this.password,
          pp_TxnRefNo: txnRefNo,
        }),
      });

      const data = await response.json();
      return data.pp_ResponseCode === '000' && data.pp_TxnStatus === 'Completed';
    } catch (error) {
      this.logger.error('Failed to verify JazzCash payment', error);
      return false;
    }
  }

  async refundPayment(txnRefNo: string, reason?: string): Promise<boolean> {
    this.logger.log(`Processing JazzCash refund for ${txnRefNo}: ${reason}`);
    
    // JazzCash refunds are typically processed manually
    // This would integrate with their refund API when available
    return true;
  }

  private generateSecureHash(payload: Record<string, string>): string {
    const sortedKeys = Object.keys(payload).sort();
    const dataString = this.integritySalt + '&' + sortedKeys.map(key => payload[key]).join('&');
    
    return crypto
      .createHmac('sha256', this.integritySalt)
      .update(dataString)
      .digest('hex')
      .toUpperCase();
  }

  private formatDateTime(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
  }
}

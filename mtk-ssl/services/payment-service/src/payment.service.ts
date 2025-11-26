import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeProvider } from './providers/stripe.provider';
import { JazzCashProvider } from './providers/jazzcash.provider';

interface CreatePaymentDto {
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'jazzcash' | 'easypaisa';
  metadata?: Record<string, string>;
  description?: string;
  returnUrl?: string;
}

interface Payment {
  id: string;
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  provider: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
  metadata?: Record<string, string>;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PaymentService {
  private payments: Map<string, Payment> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeProvider: StripeProvider,
    private readonly jazzCashProvider: JazzCashProvider,
  ) {}

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Validate amount
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    let providerResult: { paymentId: string; checkoutUrl?: string };

    switch (dto.provider) {
      case 'stripe':
        providerResult = await this.stripeProvider.createPaymentIntent({
          amount: dto.amount,
          currency: dto.currency,
          metadata: dto.metadata,
          description: dto.description,
        });
        break;
      case 'jazzcash':
        providerResult = await this.jazzCashProvider.createPayment({
          amount: dto.amount,
          currency: dto.currency || 'PKR',
          description: dto.description,
          returnUrl: dto.returnUrl,
        });
        break;
      case 'easypaisa':
        // Similar to JazzCash implementation
        providerResult = { paymentId: `EP-${id}`, checkoutUrl: `https://easypaisa.com/pay/${id}` };
        break;
      default:
        throw new BadRequestException(`Unsupported payment provider: ${dto.provider}`);
    }

    const payment: Payment = {
      id,
      tenantId: dto.tenantId,
      userId: dto.userId,
      amount: dto.amount,
      currency: dto.currency,
      status: 'pending',
      provider: dto.provider,
      providerPaymentId: providerResult.paymentId,
      checkoutUrl: providerResult.checkoutUrl,
      metadata: dto.metadata,
      description: dto.description,
      createdAt: now,
      updatedAt: now,
    };

    this.payments.set(id, payment);
    return payment;
  }

  async getPayment(id: string, tenantId: string): Promise<Payment> {
    const payment = this.payments.get(id);
    if (!payment || payment.tenantId !== tenantId) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return payment;
  }

  async confirmPayment(id: string, tenantId: string, providerPaymentId: string): Promise<Payment> {
    const payment = await this.getPayment(id, tenantId);
    
    if (payment.status !== 'pending') {
      throw new BadRequestException('Payment is not in pending state');
    }

    // Verify with provider
    let verified = false;
    switch (payment.provider) {
      case 'stripe':
        verified = await this.stripeProvider.verifyPayment(providerPaymentId);
        break;
      case 'jazzcash':
        verified = await this.jazzCashProvider.verifyPayment(providerPaymentId);
        break;
      default:
        verified = true;
    }

    if (!verified) {
      payment.status = 'failed';
    } else {
      payment.status = 'completed';
    }

    payment.updatedAt = new Date().toISOString();
    this.payments.set(id, payment);
    
    return payment;
  }

  async refundPayment(id: string, tenantId: string, reason?: string): Promise<Payment> {
    const payment = await this.getPayment(id, tenantId);
    
    if (payment.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    // Process refund with provider
    switch (payment.provider) {
      case 'stripe':
        await this.stripeProvider.refundPayment(payment.providerPaymentId!, reason);
        break;
      case 'jazzcash':
        await this.jazzCashProvider.refundPayment(payment.providerPaymentId!, reason);
        break;
    }

    payment.status = 'refunded';
    payment.updatedAt = new Date().toISOString();
    this.payments.set(id, payment);
    
    return payment;
  }

  async listPayments(tenantId: string, userId?: string, status?: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(p => p.tenantId === tenantId)
      .filter(p => !userId || p.userId === userId)
      .filter(p => !status || p.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

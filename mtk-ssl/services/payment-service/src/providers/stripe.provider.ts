import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

interface CreatePaymentIntentDto {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  description?: string;
}

@Injectable()
export class StripeProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
        typescript: true,
      });
    } else {
      this.logger.warn('Stripe secret key not configured - payments will use mock mode');
    }
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto): Promise<{ paymentId: string; clientSecret?: string }> {
    if (!this.stripe) {
      // Mock response for development
      return {
        paymentId: `mock_pi_${crypto.randomUUID()}`,
        clientSecret: 'mock_secret',
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(dto.amount * 100), // Stripe uses cents
        currency: dto.currency.toLowerCase(),
        metadata: dto.metadata,
        description: dto.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent', error);
      throw error;
    }
  }

  async verifyPayment(paymentIntentId: string): Promise<boolean> {
    if (!this.stripe) {
      return true; // Mock mode
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      this.logger.error('Failed to verify Stripe payment', error);
      return false;
    }
  }

  async refundPayment(paymentIntentId: string, reason?: string): Promise<boolean> {
    if (!this.stripe) {
      return true; // Mock mode
    }

    try {
      await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: reason ? { reason } : undefined,
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to refund Stripe payment', error);
      return false;
    }
  }

  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ sessionId: string; checkoutUrl: string }> {
    if (!this.stripe) {
      return {
        sessionId: `mock_session_${crypto.randomUUID()}`,
        checkoutUrl: 'https://checkout.stripe.com/mock',
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: 'SSL Tournament Registration',
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url!,
    };
  }
}

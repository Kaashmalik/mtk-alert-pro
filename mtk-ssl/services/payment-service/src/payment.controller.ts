import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

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
  status: string;
  provider: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
  createdAt: string;
}

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('PaymentService', 'CreatePayment')
  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.createPayment(data);
  }

  @GrpcMethod('PaymentService', 'GetPayment')
  async getPayment(data: { id: string; tenantId: string }): Promise<Payment> {
    return this.paymentService.getPayment(data.id, data.tenantId);
  }

  @GrpcMethod('PaymentService', 'ConfirmPayment')
  async confirmPayment(data: { id: string; tenantId: string; providerPaymentId: string }): Promise<Payment> {
    return this.paymentService.confirmPayment(data.id, data.tenantId, data.providerPaymentId);
  }

  @GrpcMethod('PaymentService', 'RefundPayment')
  async refundPayment(data: { id: string; tenantId: string; reason?: string }): Promise<Payment> {
    return this.paymentService.refundPayment(data.id, data.tenantId, data.reason);
  }

  @GrpcMethod('PaymentService', 'ListPayments')
  async listPayments(data: { tenantId: string; userId?: string; status?: string }): Promise<{ payments: Payment[] }> {
    const payments = await this.paymentService.listPayments(data.tenantId, data.userId, data.status);
    return { payments };
  }
}

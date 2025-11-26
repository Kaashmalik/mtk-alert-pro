import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeProvider } from './providers/stripe.provider';
import { JazzCashProvider } from './providers/jazzcash.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripeProvider, JazzCashProvider],
})
export class PaymentModule {}

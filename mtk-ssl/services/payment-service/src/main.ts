import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { PaymentModule } from './payment.module';

async function bootstrap() {
  const logger = new Logger('PaymentService');

  // gRPC Microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'payment',
        protoPath: join(__dirname, './proto/payment.proto'),
        url: '0.0.0.0:5004',
      },
    },
  );

  await app.listen();
  logger.log('💳 Payment Service running on gRPC port 5004');
}

bootstrap();

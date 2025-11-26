import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { NotificationModule } from './notification.module';

async function bootstrap() {
  const logger = new Logger('NotificationService');

  // HTTP Server for webhooks
  const app = await NestFactory.create(NotificationModule);
  
  // Connect Kafka consumer
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      },
      consumer: {
        groupId: 'notification-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(5005);
  
  logger.log('🔔 Notification Service running on port 5005');
  logger.log('📡 Kafka consumer connected');
}

bootstrap();

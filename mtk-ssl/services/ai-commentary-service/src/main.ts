import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { CommentaryModule } from './commentary.module';

async function bootstrap() {
  const logger = new Logger('AICommentaryService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CommentaryModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'ai-commentary-service',
          brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
        },
        consumer: {
          groupId: 'ai-commentary-consumer',
        },
      },
    },
  );

  await app.listen();
  logger.log('🤖 AI Commentary Service running');
  logger.log('📡 Listening on Kafka for scoring events');
}

bootstrap();

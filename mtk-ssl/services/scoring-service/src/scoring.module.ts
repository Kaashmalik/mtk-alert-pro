import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { ScoringGateway } from './scoring.gateway';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    RedisModule,
    KafkaModule,
  ],
  controllers: [ScoringController],
  providers: [ScoringService, ScoringGateway],
})
export class ScoringModule {}

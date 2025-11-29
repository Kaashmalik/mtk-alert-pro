import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScoringService } from './scoring.service';
import { ScoringGateway } from './scoring.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [ScoringService, ScoringGateway],
  exports: [ScoringService],
})
export class ScoringModule {}

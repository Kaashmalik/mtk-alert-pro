import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';

@Global()
@Module({
  providers: [
    {
      provide: KafkaService,
      useFactory: (configService: ConfigService) => {
        return new KafkaService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [KafkaService],
})
export class KafkaModule {}

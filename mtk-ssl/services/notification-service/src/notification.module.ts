import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushService } from './channels/push.service';
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, PushService, EmailService, SmsService],
})
export class NotificationModule {}

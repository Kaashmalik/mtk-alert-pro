import { Injectable, Logger } from '@nestjs/common';
import { PushService } from './channels/push.service';
import { EmailService } from './channels/email.service';
import { SmsService } from './channels/sms.service';

interface SendNotificationDto {
  tenantId: string;
  userId?: string;
  topic?: string;
  channels: ('push' | 'email' | 'sms')[];
  title: string;
  body: string;
  data?: Record<string, string>;
  email?: string;
  phone?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly pushService: PushService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async send(dto: SendNotificationDto): Promise<{ success: boolean; results: Record<string, boolean> }> {
    const results: Record<string, boolean> = {};

    for (const channel of dto.channels) {
      try {
        switch (channel) {
          case 'push':
            if (dto.userId) {
              results.push = await this.pushService.sendToUser(dto.userId, {
                title: dto.title,
                body: dto.body,
                data: dto.data,
              });
            } else if (dto.topic) {
              results.push = await this.pushService.sendToTopic(dto.topic, {
                title: dto.title,
                body: dto.body,
                data: dto.data,
              });
            }
            break;

          case 'email':
            if (dto.email) {
              results.email = await this.emailService.send({
                to: dto.email,
                subject: dto.title,
                body: dto.body,
              });
            }
            break;

          case 'sms':
            if (dto.phone) {
              results.sms = await this.smsService.send({
                to: dto.phone,
                message: `${dto.title}: ${dto.body}`,
              });
            }
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send ${channel} notification`, error);
        results[channel] = false;
      }
    }

    return {
      success: Object.values(results).some(Boolean),
      results,
    };
  }

  async broadcast(dto: { tenantId: string; topic: string; title: string; body: string }): Promise<{ success: boolean }> {
    const topic = `${dto.tenantId}_${dto.topic}`;
    const success = await this.pushService.sendToTopic(topic, {
      title: dto.title,
      body: dto.body,
    });
    return { success };
  }

  async notifyMatchStart(data: Record<string, unknown>): Promise<void> {
    const tenantId = data.tenantId as string;
    const matchId = data.id as string;
    
    await this.broadcast({
      tenantId,
      topic: `match_${matchId}`,
      title: '🏏 Match Started!',
      body: `The match is now live. Tap to watch.`,
    });
  }

  async notifyMatchEnd(data: Record<string, unknown>): Promise<void> {
    const tenantId = data.tenantId as string;
    const matchId = data.id as string;
    const result = data.result as string;
    
    await this.broadcast({
      tenantId,
      topic: `match_${matchId}`,
      title: '🏆 Match Ended',
      body: result || 'The match has concluded.',
    });
  }

  async notifyWicket(data: Record<string, unknown>): Promise<void> {
    const tenantId = data.tenantId as string;
    const matchId = data.matchId as string;
    const player = data.playerName as string;
    
    await this.broadcast({
      tenantId,
      topic: `match_${matchId}`,
      title: '🎯 WICKET!',
      body: `${player} is out!`,
    });
  }

  async notifyBoundary(data: Record<string, unknown>): Promise<void> {
    const tenantId = data.tenantId as string;
    const matchId = data.matchId as string;
    const runs = data.runs as number;
    const player = data.batsmanName as string;
    
    await this.broadcast({
      tenantId,
      topic: `match_${matchId}`,
      title: runs === 6 ? '🚀 SIX!' : '4️⃣ FOUR!',
      body: `${player} hits a ${runs === 6 ? 'massive six' : 'beautiful four'}!`,
    });
  }

  async notifyTournamentStart(data: Record<string, unknown>): Promise<void> {
    const tenantId = data.tenantId as string;
    const name = data.name as string;
    
    await this.broadcast({
      tenantId,
      topic: 'tournaments',
      title: '🏆 Tournament Started',
      body: `${name} has officially begun!`,
    });
  }
}

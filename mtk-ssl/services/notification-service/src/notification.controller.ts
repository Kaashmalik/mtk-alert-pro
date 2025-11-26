import { Controller, Post, Body } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

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

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  @Post('broadcast')
  async broadcast(@Body() dto: { tenantId: string; topic: string; title: string; body: string }) {
    return this.notificationService.broadcast(dto);
  }

  // Kafka event handlers
  @MessagePattern('ssl.match.events')
  async handleMatchEvent(@Payload() event: { type: string; data: Record<string, unknown> }) {
    switch (event.type) {
      case 'MatchStarted':
        await this.notificationService.notifyMatchStart(event.data);
        break;
      case 'MatchEnded':
        await this.notificationService.notifyMatchEnd(event.data);
        break;
      case 'WicketFallen':
        await this.notificationService.notifyWicket(event.data);
        break;
    }
  }

  @MessagePattern('ssl.scoring.ball-events')
  async handleScoringEvent(@Payload() event: { type: string; data: Record<string, unknown> }) {
    if (event.type === 'SIX_HIT' || event.type === 'FOUR_HIT') {
      await this.notificationService.notifyBoundary(event.data);
    }
  }

  @MessagePattern('ssl.tournament.events')
  async handleTournamentEvent(@Payload() event: { type: string; data: Record<string, unknown> }) {
    if (event.type === 'TournamentStarted') {
      await this.notificationService.notifyTournamentStart(event.data);
    }
  }
}

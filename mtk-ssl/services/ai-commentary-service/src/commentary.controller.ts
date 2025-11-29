import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { CommentaryService, BallEvent, Commentary } from './commentary.service';

@Controller()
export class CommentaryController {
  private readonly logger = new Logger(CommentaryController.name);

  constructor(private readonly commentaryService: CommentaryService) {}

  @MessagePattern('ssl.scoring.ball-events')
  async handleBallEvent(@Payload() event: BallEvent, @Ctx() _context: KafkaContext): Promise<Commentary | null> {
    this.logger.debug(`Processing ball event: ${event.matchId} - ${event.over}.${event.ball}`);
    
    try {
      const commentary = await this.commentaryService.generateCommentary(event);
      
      this.logger.log(`Generated commentary for ${event.matchId}/${event.over}.${event.ball}`);
      
      return commentary;
    } catch (error) {
      this.logger.error('Failed to generate commentary', error);
      return null;
    }
  }

  @MessagePattern('ssl.match.events')
  async handleMatchEvent(@Payload() event: { type: string; data: Record<string, unknown> }) {
    if (event.type === 'MatchStarted') {
      return this.commentaryService.generateMatchIntro(event.data);
    }
    
    if (event.type === 'MatchEnded') {
      return this.commentaryService.generateMatchSummary(event.data);
    }
    
    return null;
  }
}

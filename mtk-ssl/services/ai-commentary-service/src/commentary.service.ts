import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai/openai.service';
import { Kafka, Producer } from 'kafkajs';

export interface BallEvent {
  matchId: string;
  tenantId: string;
  inning: number;
  over: number;
  ball: number;
  runs: number;
  extras?: { type: string; runs: number };
  wicket?: { type: string; playerOut: string; dismissedBy?: string };
  batsmanId: string;
  batsmanName: string;
  bowlerId: string;
  bowlerName: string;
  shotType?: string;
  timestamp: string;
}

export interface Commentary {
  matchId: string;
  ballId: string;
  english: string;
  urdu: string;
  timestamp: string;
}

@Injectable()
export class CommentaryService {
  private readonly logger = new Logger(CommentaryService.name);
  private producer: Producer;
  private matchContexts: Map<string, string[]> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly openaiService: OpenAIService,
  ) {
    this.initKafkaProducer();
  }

  private async initKafkaProducer() {
    const kafka = new Kafka({
      clientId: 'ai-commentary-producer',
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
    });
    
    this.producer = kafka.producer();
    await this.producer.connect();
  }

  async generateCommentary(event: BallEvent): Promise<Commentary> {
    const ballId = `${event.over}.${event.ball}`;
    
    // Build context from recent events
    const context = this.getMatchContext(event.matchId);
    
    // Generate English commentary
    const englishPrompt = this.buildPrompt(event, context, 'english');
    const english = await this.openaiService.generateText(englishPrompt);
    
    // Generate Urdu commentary
    const urduPrompt = this.buildPrompt(event, context, 'urdu');
    const urdu = await this.openaiService.generateText(urduPrompt);
    
    const commentary: Commentary = {
      matchId: event.matchId,
      ballId,
      english,
      urdu,
      timestamp: new Date().toISOString(),
    };

    // Update context
    this.updateMatchContext(event.matchId, english);

    // Publish to Kafka
    await this.publishCommentary(commentary);

    return commentary;
  }

  async generateMatchIntro(data: Record<string, unknown>): Promise<string> {
    const prompt = `Generate an exciting cricket match introduction:
Team A: ${data.teamAName}
Team B: ${data.teamBName}
Venue: ${data.venueName}
Tournament: ${data.tournamentName}

Write 2-3 sentences to build excitement for this match.`;

    return this.openaiService.generateText(prompt);
  }

  async generateMatchSummary(data: Record<string, unknown>): Promise<string> {
    const prompt = `Generate a cricket match summary:
Winner: ${data.winnerName}
Result: ${data.result}
Player of the Match: ${data.motmName}

Write 2-3 sentences summarizing this exciting match.`;

    return this.openaiService.generateText(prompt);
  }

  private buildPrompt(event: BallEvent, context: string[], language: 'english' | 'urdu'): string {
    const langInstruction = language === 'urdu' 
      ? 'Respond in Urdu script using cricket terminology. Be enthusiastic like a Pakistani commentator.'
      : 'Respond in English. Be enthusiastic like a professional cricket commentator.';

    let eventDescription = `Over ${event.over}.${event.ball}: ${event.bowlerName} to ${event.batsmanName}`;
    
    if (event.wicket) {
      eventDescription += ` - WICKET! ${event.wicket.playerOut} is ${event.wicket.type}!`;
    } else if (event.runs === 6) {
      eventDescription += ` - SIX! ${event.shotType || 'Massive hit'}!`;
    } else if (event.runs === 4) {
      eventDescription += ` - FOUR! ${event.shotType || 'Beautiful boundary'}!`;
    } else if (event.runs === 0 && !event.extras) {
      eventDescription += ' - Dot ball.';
    } else {
      eventDescription += ` - ${event.runs} run(s). ${event.shotType || ''}`;
    }

    if (event.extras) {
      eventDescription += ` (${event.extras.type}: ${event.extras.runs})`;
    }

    return `${langInstruction}

Recent context: ${context.slice(-3).join(' ')}

Current ball: ${eventDescription}

Generate 1-2 sentences of live commentary (max 50 words):`;
  }

  private getMatchContext(matchId: string): string[] {
    return this.matchContexts.get(matchId) || [];
  }

  private updateMatchContext(matchId: string, commentary: string) {
    const context = this.getMatchContext(matchId);
    context.push(commentary);
    
    // Keep only last 10 commentaries
    if (context.length > 10) {
      context.shift();
    }
    
    this.matchContexts.set(matchId, context);
  }

  private async publishCommentary(commentary: Commentary) {
    try {
      await this.producer.send({
        topic: 'ssl.commentary',
        messages: [{
          key: commentary.matchId,
          value: JSON.stringify(commentary),
          headers: {
            'content-type': 'application/json',
          },
        }],
      });
    } catch (error) {
      this.logger.error('Failed to publish commentary', error);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log(`OpenAI client initialized with model: ${this.model}`);
    } else {
      this.logger.warn('OpenAI API key not configured - using mock responses');
    }
  }

  async generateText(prompt: string, maxTokens = 100): Promise<string> {
    if (!this.client) {
      return this.getMockResponse(prompt);
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert cricket commentator providing exciting live commentary for Shakir Super League matches. Be enthusiastic, use cricket terminology, and keep responses concise.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content || 'What a moment in this match!';
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      return this.getMockResponse(prompt);
    }
  }

  async generateWithContext(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    maxTokens = 150,
  ): Promise<string> {
    if (!this.client) {
      return this.getMockResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      return this.getMockResponse('');
    }
  }

  private getMockResponse(prompt: string): string {
    const mockResponses = [
      'What an exciting moment in this match! The crowd is on their feet!',
      'Brilliant cricketing moment here at the Shakir Super League!',
      'The batsman shows great technique with that shot!',
      'The bowler is really putting the pressure on here!',
      'This match is heating up! Every ball counts now!',
      'Superb fielding effort! The crowd loves it!',
      'بہترین شاٹ! کیا کھیل ہے!',
      'کیا چھکا! سٹیڈیم میں جشن کا ماحول!',
    ];

    // Simple logic to return relevant mock response
    if (prompt.toLowerCase().includes('six') || prompt.toLowerCase().includes('چھکا')) {
      return 'What a massive SIX! The ball has gone miles into the stands! کیا چھکا مارا!';
    }
    if (prompt.toLowerCase().includes('wicket')) {
      return 'WICKET! The bowler strikes! This changes everything! وکٹ گر گئی!';
    }
    if (prompt.toLowerCase().includes('four')) {
      return 'FOUR runs! Beautifully timed shot racing to the boundary! خوبصورت چوکا!';
    }

    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }
}

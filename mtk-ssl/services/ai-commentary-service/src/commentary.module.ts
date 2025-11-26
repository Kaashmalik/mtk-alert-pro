import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommentaryController } from './commentary.controller';
import { CommentaryService } from './commentary.service';
import { OpenAIService } from './openai/openai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [CommentaryController],
  providers: [CommentaryService, OpenAIService],
})
export class CommentaryModule {}

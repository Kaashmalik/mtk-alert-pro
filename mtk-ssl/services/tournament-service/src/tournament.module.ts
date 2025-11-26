import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { TeamsService } from './teams/teams.service';
import { MatchesService } from './matches/matches.service';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    KafkaModule,
  ],
  controllers: [TournamentController],
  providers: [TournamentService, TeamsService, MatchesService],
})
export class TournamentModule {}

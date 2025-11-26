import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { TournamentService } from './tournament.service';

interface CreateTournamentDto {
  name: string;
  tenantId: string;
  format: 'knockout' | 'league' | 'hybrid' | 'round_robin';
  startDate: string;
  endDate: string;
  maxTeams?: number;
  description?: string;
}

interface Tournament {
  id: string;
  name: string;
  tenantId: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  maxTeams: number;
  createdAt: string;
}

@Controller()
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  // gRPC methods
  @GrpcMethod('TournamentService', 'CreateTournament')
  async createTournament(data: CreateTournamentDto): Promise<Tournament> {
    return this.tournamentService.create(data);
  }

  @GrpcMethod('TournamentService', 'GetTournament')
  async getTournament(data: { id: string; tenantId: string }): Promise<Tournament> {
    return this.tournamentService.findById(data.id, data.tenantId);
  }

  @GrpcMethod('TournamentService', 'ListTournaments')
  async listTournaments(data: { tenantId: string; status?: string }): Promise<{ tournaments: Tournament[] }> {
    const tournaments = await this.tournamentService.findAll(data.tenantId, data.status);
    return { tournaments };
  }

  @GrpcMethod('TournamentService', 'UpdateTournament')
  async updateTournament(data: { id: string; tenantId: string } & Partial<CreateTournamentDto>): Promise<Tournament> {
    return this.tournamentService.update(data.id, data.tenantId, data);
  }

  @GrpcMethod('TournamentService', 'DeleteTournament')
  async deleteTournament(data: { id: string; tenantId: string }): Promise<{ success: boolean }> {
    await this.tournamentService.delete(data.id, data.tenantId);
    return { success: true };
  }

  // Kafka event handlers
  @MessagePattern('ssl.tournament.commands')
  async handleTournamentCommand(@Payload() message: { type: string; data: Record<string, unknown> }) {
    switch (message.type) {
      case 'START_TOURNAMENT':
        return this.tournamentService.startTournament(message.data.id as string, message.data.tenantId as string);
      case 'END_TOURNAMENT':
        return this.tournamentService.endTournament(message.data.id as string, message.data.tenantId as string);
      default:
        return { error: 'Unknown command' };
    }
  }
}

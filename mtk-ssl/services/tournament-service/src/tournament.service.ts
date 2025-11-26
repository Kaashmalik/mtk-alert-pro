import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka/kafka.service';

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
  description?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaService: KafkaService,
  ) {}

  async create(dto: CreateTournamentDto): Promise<Tournament> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const tournament: Tournament = {
      id,
      name: dto.name,
      tenantId: dto.tenantId,
      format: dto.format,
      status: 'draft',
      startDate: dto.startDate,
      endDate: dto.endDate,
      maxTeams: dto.maxTeams || 16,
      description: dto.description,
      createdAt: now,
      updatedAt: now,
    };

    this.tournaments.set(id, tournament);

    // Publish event
    await this.kafkaService.publish('ssl.tournament.events', {
      type: 'TournamentCreated',
      data: tournament,
      timestamp: now,
    });

    return tournament;
  }

  async findById(id: string, tenantId: string): Promise<Tournament> {
    const tournament = this.tournaments.get(id);
    
    if (!tournament || tournament.tenantId !== tenantId) {
      throw new NotFoundException(`Tournament ${id} not found`);
    }

    return tournament;
  }

  async findAll(tenantId: string, status?: string): Promise<Tournament[]> {
    return Array.from(this.tournaments.values())
      .filter(t => t.tenantId === tenantId)
      .filter(t => !status || t.status === status);
  }

  async update(id: string, tenantId: string, dto: Partial<CreateTournamentDto>): Promise<Tournament> {
    const tournament = await this.findById(id, tenantId);
    
    const updated: Tournament = {
      ...tournament,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.tournaments.set(id, updated);

    await this.kafkaService.publish('ssl.tournament.events', {
      type: 'TournamentUpdated',
      data: updated,
      timestamp: updated.updatedAt,
    });

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const tournament = await this.findById(id, tenantId);
    
    if (tournament.status === 'live') {
      throw new ConflictException('Cannot delete a live tournament');
    }

    this.tournaments.delete(id);

    await this.kafkaService.publish('ssl.tournament.events', {
      type: 'TournamentDeleted',
      data: { id, tenantId },
      timestamp: new Date().toISOString(),
    });
  }

  async startTournament(id: string, tenantId: string): Promise<Tournament> {
    const tournament = await this.findById(id, tenantId);
    
    if (tournament.status !== 'draft' && tournament.status !== 'registration') {
      throw new ConflictException('Tournament cannot be started');
    }

    return this.update(id, tenantId, { ...tournament, status: 'live' } as CreateTournamentDto);
  }

  async endTournament(id: string, tenantId: string): Promise<Tournament> {
    const tournament = await this.findById(id, tenantId);
    
    if (tournament.status !== 'live') {
      throw new ConflictException('Tournament is not live');
    }

    return this.update(id, tenantId, { ...tournament, status: 'completed' } as CreateTournamentDto);
  }
}

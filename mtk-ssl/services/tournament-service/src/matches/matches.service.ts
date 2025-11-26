import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';

interface Match {
  id: string;
  tenantId: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  venueId?: string;
  matchNumber?: number;
  matchType: 'group' | 'knockout' | 'final' | 'semi_final' | 'quarter_final';
  scheduledDate?: string;
  startDate?: string;
  endDate?: string;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned' | 'cancelled';
  tossWinnerId?: string;
  tossDecision?: 'bat' | 'bowl';
  winnerId?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateMatchDto {
  tenantId: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  venueId?: string;
  matchNumber?: number;
  matchType: 'group' | 'knockout' | 'final' | 'semi_final' | 'quarter_final';
  scheduledDate?: string;
}

@Injectable()
export class MatchesService {
  private matches: Map<string, Match> = new Map();

  constructor(private readonly kafkaService: KafkaService) {}

  async create(dto: CreateMatchDto): Promise<Match> {
    if (dto.teamAId === dto.teamBId) {
      throw new ConflictException('Teams cannot play against themselves');
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const match: Match = {
      id,
      tenantId: dto.tenantId,
      tournamentId: dto.tournamentId,
      teamAId: dto.teamAId,
      teamBId: dto.teamBId,
      venueId: dto.venueId,
      matchNumber: dto.matchNumber,
      matchType: dto.matchType,
      scheduledDate: dto.scheduledDate,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };

    this.matches.set(id, match);

    await this.kafkaService.publish('ssl.match.events', {
      type: 'MatchCreated',
      data: match,
      timestamp: now,
    });

    return match;
  }

  async findById(id: string, tenantId: string): Promise<Match> {
    const match = this.matches.get(id);
    if (!match || match.tenantId !== tenantId) {
      throw new NotFoundException(`Match ${id} not found`);
    }
    return match;
  }

  async findByTournament(tournamentId: string, tenantId: string): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(m => m.tenantId === tenantId && m.tournamentId === tournamentId);
  }

  async findLive(tenantId: string): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(m => m.tenantId === tenantId && m.status === 'live');
  }

  async startMatch(id: string, tenantId: string, tossWinnerId: string, tossDecision: 'bat' | 'bowl'): Promise<Match> {
    const match = await this.findById(id, tenantId);
    
    if (match.status !== 'scheduled') {
      throw new ConflictException('Match cannot be started');
    }

    match.status = 'live';
    match.startDate = new Date().toISOString();
    match.tossWinnerId = tossWinnerId;
    match.tossDecision = tossDecision;
    match.updatedAt = new Date().toISOString();

    this.matches.set(id, match);

    await this.kafkaService.publish('ssl.match.events', {
      type: 'MatchStarted',
      data: match,
      timestamp: match.updatedAt,
    });

    return match;
  }

  async endMatch(id: string, tenantId: string, winnerId: string, result: string): Promise<Match> {
    const match = await this.findById(id, tenantId);
    
    if (match.status !== 'live') {
      throw new ConflictException('Match is not live');
    }

    match.status = 'completed';
    match.endDate = new Date().toISOString();
    match.winnerId = winnerId;
    match.result = result;
    match.updatedAt = new Date().toISOString();

    this.matches.set(id, match);

    await this.kafkaService.publish('ssl.match.events', {
      type: 'MatchEnded',
      data: match,
      timestamp: match.updatedAt,
    });

    return match;
  }

  async abandonMatch(id: string, tenantId: string, reason: string): Promise<Match> {
    const match = await this.findById(id, tenantId);
    
    match.status = 'abandoned';
    match.result = `Abandoned: ${reason}`;
    match.updatedAt = new Date().toISOString();

    this.matches.set(id, match);

    await this.kafkaService.publish('ssl.match.events', {
      type: 'MatchAbandoned',
      data: { ...match, reason },
      timestamp: match.updatedAt,
    });

    return match;
  }
}

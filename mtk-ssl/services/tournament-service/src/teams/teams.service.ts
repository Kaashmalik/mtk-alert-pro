import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

interface Team {
  id: string;
  name: string;
  slug: string;
  tenantId: string;
  tournamentId?: string;
  captainId?: string;
  managerId?: string;
  logoUrl?: string;
  jerseyColor?: string;
  players: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateTeamDto {
  name: string;
  tenantId: string;
  tournamentId?: string;
  captainId?: string;
  managerId?: string;
  logoUrl?: string;
  jerseyColor?: string;
}

@Injectable()
export class TeamsService {
  private teams: Map<string, Team> = new Map();

  async create(dto: CreateTeamDto): Promise<Team> {
    const id = crypto.randomUUID();
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-');
    const now = new Date().toISOString();

    const team: Team = {
      id,
      name: dto.name,
      slug,
      tenantId: dto.tenantId,
      tournamentId: dto.tournamentId,
      captainId: dto.captainId,
      managerId: dto.managerId,
      logoUrl: dto.logoUrl,
      jerseyColor: dto.jerseyColor,
      players: [],
      createdAt: now,
      updatedAt: now,
    };

    this.teams.set(id, team);
    return team;
  }

  async findById(id: string, tenantId: string): Promise<Team> {
    const team = this.teams.get(id);
    if (!team || team.tenantId !== tenantId) {
      throw new NotFoundException(`Team ${id} not found`);
    }
    return team;
  }

  async findByTournament(tournamentId: string, tenantId: string): Promise<Team[]> {
    return Array.from(this.teams.values())
      .filter(t => t.tenantId === tenantId && t.tournamentId === tournamentId);
  }

  async addPlayer(teamId: string, playerId: string, tenantId: string): Promise<Team> {
    const team = await this.findById(teamId, tenantId);
    
    if (team.players.includes(playerId)) {
      throw new ConflictException('Player already in team');
    }

    team.players.push(playerId);
    team.updatedAt = new Date().toISOString();
    this.teams.set(teamId, team);
    
    return team;
  }

  async removePlayer(teamId: string, playerId: string, tenantId: string): Promise<Team> {
    const team = await this.findById(teamId, tenantId);
    
    team.players = team.players.filter(p => p !== playerId);
    team.updatedAt = new Date().toISOString();
    this.teams.set(teamId, team);
    
    return team;
  }

  async update(id: string, tenantId: string, dto: Partial<CreateTeamDto>): Promise<Team> {
    const team = await this.findById(id, tenantId);
    
    const updated: Team = {
      ...team,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.teams.set(id, updated);
    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    this.teams.delete(id);
  }
}

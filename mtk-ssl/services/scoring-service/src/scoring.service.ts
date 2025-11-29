import { Injectable } from '@nestjs/common';

export interface BallEvent {
  matchId: string;
  inningsId: string;
  over: number;
  ball: number;
  runs: number;
  extras?: {
    type: 'wide' | 'noball' | 'bye' | 'legbye';
    runs: number;
  };
  wicket?: {
    type: string;
    playerId: string;
    fielderId?: string;
  };
  batsmanId: string;
  bowlerId: string;
  timestamp: Date;
}

export interface Scorecard {
  matchId: string;
  innings: number;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  balls: number;
  runRate: number;
}

export interface BallResult {
  ballId: string;
  scorecard: Scorecard;
}

export interface MatchState {
  matchId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  innings1?: Scorecard;
  innings2?: Scorecard;
  currentInnings: number;
}

@Injectable()
export class ScoringService {
  private matchStates: Map<string, MatchState> = new Map();

  async getMatchState(matchId: string): Promise<MatchState | null> {
    // TODO: Fetch from database
    return this.matchStates.get(matchId) || {
      matchId,
      status: 'not_started',
      currentInnings: 1,
    };
  }

  async recordBall(ballEvent: BallEvent): Promise<BallResult> {
    // TODO: Persist to database and update match state
    const ballId = `ball-${Date.now()}`;
    
    const matchState = await this.getMatchState(ballEvent.matchId);
    const currentScorecard: Scorecard = {
      matchId: ballEvent.matchId,
      innings: matchState?.currentInnings || 1,
      totalRuns: ballEvent.runs + (ballEvent.extras?.runs || 0),
      totalWickets: ballEvent.wicket ? 1 : 0,
      overs: ballEvent.over,
      balls: ballEvent.ball,
      runRate: 0, // Calculate based on total runs and overs
    };

    return {
      ballId,
      scorecard: currentScorecard,
    };
  }

  async undoBall(matchId: string, ballId: string): Promise<BallResult> {
    // TODO: Remove ball from database and recalculate scorecard
    const matchState = await this.getMatchState(matchId);
    
    return {
      ballId,
      scorecard: {
        matchId,
        innings: matchState?.currentInnings || 1,
        totalRuns: 0,
        totalWickets: 0,
        overs: 0,
        balls: 0,
        runRate: 0,
      },
    };
  }
}

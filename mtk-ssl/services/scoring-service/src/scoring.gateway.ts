import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ScoringService } from './scoring.service';

interface BallEvent {
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

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  namespace: '/scoring',
})
export class ScoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Set<string>> = new Map(); // matchId -> socketIds

  constructor(private readonly scoringService: ScoringService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove from all match rooms
    this.connectedClients.forEach((clients, matchId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(matchId);
      }
    });
  }

  @SubscribeMessage('join-match')
  async handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { matchId } = data;
    
    // Join the match room
    await client.join(`match:${matchId}`);
    
    // Track connected clients
    if (!this.connectedClients.has(matchId)) {
      this.connectedClients.set(matchId, new Set());
    }
    this.connectedClients.get(matchId)?.add(client.id);

    // Send current match state
    const matchState = await this.scoringService.getMatchState(matchId);
    client.emit('match-state', matchState);

    console.log(`Client ${client.id} joined match ${matchId}`);
    return { success: true, matchId };
  }

  @SubscribeMessage('leave-match')
  async handleLeaveMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { matchId } = data;
    
    await client.leave(`match:${matchId}`);
    this.connectedClients.get(matchId)?.delete(client.id);

    console.log(`Client ${client.id} left match ${matchId}`);
    return { success: true };
  }

  @SubscribeMessage('record-ball')
  async handleRecordBall(
    @ConnectedSocket() client: Socket,
    @MessageBody() ballEvent: BallEvent,
  ) {
    try {
      // Process the ball event
      const result = await this.scoringService.recordBall(ballEvent);

      // Broadcast to all clients in the match room
      this.server.to(`match:${ballEvent.matchId}`).emit('ball-recorded', {
        ...ballEvent,
        ...result,
      });

      // Emit score update
      this.server.to(`match:${ballEvent.matchId}`).emit('score-update', result.scorecard);

      // If wicket fell, emit special event
      if (ballEvent.wicket) {
        this.server.to(`match:${ballEvent.matchId}`).emit('wicket-fell', {
          wicket: ballEvent.wicket,
          scorecard: result.scorecard,
        });
      }

      return { success: true, result };
    } catch (error) {
      console.error('Error recording ball:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  @SubscribeMessage('undo-ball')
  async handleUndoBall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; ballId: string },
  ) {
    try {
      const result = await this.scoringService.undoBall(data.matchId, data.ballId);

      this.server.to(`match:${data.matchId}`).emit('ball-undone', result);
      this.server.to(`match:${data.matchId}`).emit('score-update', result.scorecard);

      return { success: true, result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Broadcast match state to all connected clients
  async broadcastMatchState(matchId: string) {
    const matchState = await this.scoringService.getMatchState(matchId);
    this.server.to(`match:${matchId}`).emit('match-state', matchState);
  }

  // Get connected client count for a match
  getConnectedClientsCount(matchId: string): number {
    return this.connectedClients.get(matchId)?.size || 0;
  }
}

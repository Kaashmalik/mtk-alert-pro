import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { ScoringService } from "./scoring.service";

@WebSocketGateway({
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://ssl.cricket",
      "https://app.ssl.cricket",
      "https://admin.ssl.cricket",
    ],
    credentials: true,
  },
  namespace: "/",
})
export class ScoringGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ScoringGateway.name);

  constructor(private readonly scoringService: ScoringService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up any match subscriptions
    const rooms = Array.from(client.rooms);
    rooms.forEach((room) => {
      if (room.startsWith("match:")) {
        client.leave(room);
      }
    });
  }

  @SubscribeMessage("join-match")
  async handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string
  ) {
    try {
      const room = `match:${matchId}`;
      await client.join(room);
      this.logger.log(`Client ${client.id} joined match ${matchId}`);

      // Send current match state to the new client
      const matchState = await this.scoringService.getMatchState(matchId);
      client.emit("match-state", matchState);

      // Notify other clients
      client.to(room).emit("scorer-joined", {
        matchId,
        scorerId: client.id,
      });

      return { success: true, matchId };
    } catch (error) {
      this.logger.error(`Error joining match: ${error.message}`);
      client.emit("error", { message: "Failed to join match" });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage("ball-added")
  async handleBallAdded(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; ballData: any }
  ) {
    try {
      const { matchId, ballData } = data;
      this.logger.log(`Ball added for match ${matchId} by ${client.id}`);

      // Save ball to database
      const savedBall = await this.scoringService.addBall(matchId, ballData);

      // Broadcast to all clients in the match room
      const room = `match:${matchId}`;
      this.server.to(room).emit("ball-added", {
        matchId,
        ball: savedBall,
        scorerId: client.id,
      });

      // Update match state
      const matchState = await this.scoringService.getMatchState(matchId);
      this.server.to(room).emit("match-state-updated", matchState);

      return { success: true, ball: savedBall };
    } catch (error) {
      this.logger.error(`Error adding ball: ${error.message}`);
      client.emit("error", { message: "Failed to add ball" });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage("ball-undo")
  async handleBallUndo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; ballId: string }
  ) {
    try {
      const { matchId, ballId } = data;
      this.logger.log(`Ball undo for match ${matchId}, ball ${ballId}`);

      // Remove ball from database
      await this.scoringService.removeBall(matchId, ballId);

      // Broadcast to all clients
      const room = `match:${matchId}`;
      this.server.to(room).emit("ball-removed", {
        matchId,
        ballId,
        scorerId: client.id,
      });

      // Update match state
      const matchState = await this.scoringService.getMatchState(matchId);
      this.server.to(room).emit("match-state-updated", matchState);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error undoing ball: ${error.message}`);
      client.emit("error", { message: "Failed to undo ball" });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage("leave-match")
  async handleLeaveMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string
  ) {
    const room = `match:${matchId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left match ${matchId}`);

    client.to(room).emit("scorer-left", {
      matchId,
      scorerId: client.id,
    });

    return { success: true };
  }
}


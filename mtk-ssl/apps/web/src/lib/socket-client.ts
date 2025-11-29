"use client";

import { io } from "socket.io-client";

type SocketClient = ReturnType<typeof io>;
let socket: SocketClient | null = null;

export function getSocket(matchId: string): SocketClient {
  if (socket && socket.connected) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  socket = io(apiUrl, {
    path: "/socket.io",
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected");
    socket?.emit("join-match", matchId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("error", (error: Error) => {
    console.error("Socket error:", error);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitBall(matchId: string, ballData: Record<string, unknown>) {
  const s = getSocket(matchId);
  s.emit("ball-added", { matchId, ballData });
}

export function onBallAdded(callback: (ballData: unknown) => void) {
  if (socket) {
    socket.on("ball-added", callback);
  }
}

export function offBallAdded(callback: (ballData: unknown) => void) {
  if (socket) {
    socket.off("ball-added", callback);
  }
}


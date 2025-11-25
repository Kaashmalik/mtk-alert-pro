"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(matchId: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  socket = io(apiUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
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

  socket.on("error", (error) => {
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

export function emitBall(matchId: string, ballData: any) {
  const s = getSocket(matchId);
  s.emit("ball-added", { matchId, ballData });
}

export function onBallAdded(callback: (ballData: any) => void) {
  if (socket) {
    socket.on("ball-added", callback);
  }
}

export function offBallAdded(callback: (ballData: any) => void) {
  if (socket) {
    socket.off("ball-added", callback);
  }
}


"use client";

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { BallData } from "@/stores/scoring-store";

interface ScoringDB extends DBSchema {
  pendingBalls: {
    key: string;
    value: BallData & { matchId: string; synced: boolean };
  };
}

let db: IDBPDatabase<ScoringDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<ScoringDB>> {
  if (db) return db;

  db = await openDB<ScoringDB>("scoring-db", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pendingBalls")) {
        db.createObjectStore("pendingBalls", { keyPath: "id" });
      }
    },
  });

  return db;
}

export async function savePendingBall(matchId: string, ball: BallData): Promise<void> {
  const database = await initOfflineDB();
  await database.put("pendingBalls", {
    ...ball,
    matchId,
    synced: false,
  });
}

export async function getPendingBalls(matchId: string): Promise<BallData[]> {
  const database = await initOfflineDB();
  const tx = database.transaction("pendingBalls", "readonly");
  const store = tx.objectStore("pendingBalls");
  const all = await store.getAll();
  
  return all
    .filter((b) => b.matchId === matchId && !b.synced)
    .map(({ matchId, synced, ...ball }) => ball);
}

export async function markBallSynced(ballId: string): Promise<void> {
  const database = await initOfflineDB();
  const tx = database.transaction("pendingBalls", "readwrite");
  const store = tx.objectStore("pendingBalls");
  const ball = await store.get(ballId);
  
  if (ball) {
    await store.put({ ...ball, synced: true });
  }
}

export async function clearSyncedBalls(): Promise<void> {
  const database = await initOfflineDB();
  const tx = database.transaction("pendingBalls", "readwrite");
  const store = tx.objectStore("pendingBalls");
  const all = await store.getAll();
  
  for (const ball of all) {
    if (ball.synced) {
      await store.delete(ball.id);
    }
  }
}


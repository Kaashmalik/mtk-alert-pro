"use client";

import { useEffect } from "react";
import { useScoringStore } from "@/stores/scoring-store";
import { getPendingBalls, markBallSynced, clearSyncedBalls } from "@/lib/offline-sync";
import { emitBall } from "@/lib/socket-client";

export function useOfflineSync() {
  const isOnline = useScoringStore((state) => state.isOnline);
  const matchId = useScoringStore((state) => state.matchId);
  const setOnline = useScoringStore((state) => state.setOnline);
  const syncPending = useScoringStore((state) => state.syncPending);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (!isOnline || !matchId) return;

    const sync = async () => {
      try {
        const pending = await getPendingBalls(matchId);
        
        for (const ball of pending) {
          try {
            emitBall(matchId, ball);
            await markBallSynced(ball.id);
          } catch (error) {
            console.error("Failed to sync ball:", error);
          }
        }

        await clearSyncedBalls();
        await syncPending();
      } catch (error) {
        console.error("Failed to sync pending balls:", error);
      }
    };

    sync();
  }, [isOnline, matchId, syncPending]);
}


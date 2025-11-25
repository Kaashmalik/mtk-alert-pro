import { useEffect } from "react";
import * as Network from "expo-network";
import { useOfflineStore } from "@/store/offline-store";
import { supabase } from "@/lib/supabase";

export function useOfflineSync() {
  const { isOnline, setOnline, getPendingBalls, markBallSynced, clearSyncedBalls } =
    useOfflineStore();

  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setOnline(networkState.isConnected ?? false);
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval);
  }, [setOnline]);

  useEffect(() => {
    if (!isOnline) return;

    const syncPendingBalls = async () => {
      const pendingBalls = getPendingBalls("");
      
      for (const ball of pendingBalls) {
        try {
          // Sync to Supabase or API
          const { error } = await supabase.from("match_balls").insert({
            match_id: ball.matchId,
            innings: ball.innings,
            over: ball.over,
            ball: ball.ball,
            runs: ball.runs,
            is_wicket: ball.isWicket,
            wicket_type: ball.wicketType,
            batsman_id: ball.batsmanId,
            bowler_id: ball.bowlerId,
          });

          if (!error) {
            markBallSynced(ball.id);
          }
        } catch (error) {
          console.error("Failed to sync ball:", error);
        }
      }

      clearSyncedBalls();
    };

    syncPendingBalls();
    const interval = setInterval(syncPendingBalls, 10000);

    return () => clearInterval(interval);
  }, [isOnline, getPendingBalls, markBallSynced, clearSyncedBalls]);
}


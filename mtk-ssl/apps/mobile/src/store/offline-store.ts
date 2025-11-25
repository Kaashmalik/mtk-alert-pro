import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BallData {
  id: string;
  matchId: string;
  innings: number;
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  batsmanId?: string;
  bowlerId?: string;
  timestamp: number;
  synced: boolean;
}

interface OfflineStore {
  isOnline: boolean;
  pendingBalls: BallData[];
  setOnline: (online: boolean) => void;
  addPendingBall: (ball: BallData) => void;
  markBallSynced: (ballId: string) => void;
  clearSyncedBalls: () => void;
  getPendingBalls: (matchId: string) => BallData[];
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingBalls: [],
      setOnline: (online) => set({ isOnline: online }),
      addPendingBall: (ball) =>
        set((state) => ({
          pendingBalls: [...state.pendingBalls, ball],
        })),
      markBallSynced: (ballId) =>
        set((state) => ({
          pendingBalls: state.pendingBalls.map((ball) =>
            ball.id === ballId ? { ...ball, synced: true } : ball
          ),
        })),
      clearSyncedBalls: () =>
        set((state) => ({
          pendingBalls: state.pendingBalls.filter((ball) => !ball.synced),
        })),
      getPendingBalls: (matchId) =>
        get().pendingBalls.filter(
          (ball) => ball.matchId === matchId && !ball.synced
        ),
    }),
    {
      name: "offline-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);


import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BallInput = 0 | 1 | 2 | 3 | 4 | 6 | "W" | "WD" | "NB" | "LB" | "B";
export type WicketType = "bowled" | "caught" | "lbw" | "run_out" | "stumped" | "hit_wicket";

export interface BallData {
  id: string;
  overNumber: number;
  ballNumber: number;
  input: BallInput;
  runs: number;
  isWicket: boolean;
  wicketType?: WicketType;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  batsmanId?: string;
  bowlerId?: string;
  shotDirection?: string;
  shotType?: string;
  timestamp: number;
}

export interface InningsState {
  inningsId: string;
  teamId: string;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  extras: number;
  byes: number;
  legByes: number;
  wides: number;
  noBalls: number;
  status: "not_started" | "in_progress" | "completed";
  currentOver: number;
  currentBall: number;
  balls: BallData[];
}

export interface ScoringState {
  matchId: string;
  currentInnings: 1 | 2 | "super_over";
  innings1: InningsState | null;
  innings2: InningsState | null;
  superOver: InningsState | null;
  isOnline: boolean;
  pendingSync: BallData[];
  history: BallData[][];
  historyIndex: number;
  
  // Actions
  addBall: (ball: Omit<BallData, "id" | "timestamp">) => void;
  undo: () => void;
  redo: () => void;
  setOnline: (online: boolean) => void;
  syncPending: () => Promise<void>;
  resetInnings: (innings: 1 | 2 | "super_over") => void;
  setMatchId: (matchId: string) => void;
}

const createInitialInnings = (teamId: string, inningsId: string): InningsState => ({
  inningsId,
  teamId,
  totalRuns: 0,
  totalWickets: 0,
  totalBalls: 0,
  extras: 0,
  byes: 0,
  legByes: 0,
  wides: 0,
  noBalls: 0,
  status: "not_started",
  currentOver: 0,
  currentBall: 0,
  balls: [],
});

const calculateRuns = (input: BallInput): number => {
  if (typeof input === "number") return input;
  if (input === "WD" || input === "NB") return 1;
  return 0;
};

const calculateBallData = (
  input: BallInput,
  wicketType?: WicketType,
  runs?: number
): Partial<BallData> => {
  const ballRuns = runs ?? calculateRuns(input);
  const isWide = input === "WD";
  const isNoBall = input === "NB";
  const isBye = input === "B";
  const isLegBye = input === "LB";
  const isWicket = input === "W" || !!wicketType;
  const isFour = ballRuns === 4 && !isWide && !isNoBall && !isBye && !isLegBye;
  const isSix = ballRuns === 6 && !isWide && !isNoBall && !isBye && !isLegBye;

  return {
    input,
    runs: ballRuns,
    isWicket,
    wicketType,
    isWide,
    isNoBall,
    isBye,
    isLegBye,
    isFour,
    isSix,
  };
};

export const useScoringStore = create<ScoringState>()(
  persist(
    (set, get) => ({
      matchId: "",
      currentInnings: 1,
      innings1: null,
      innings2: null,
      superOver: null,
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      pendingSync: [],
      history: [],
      historyIndex: -1,

      setMatchId: (matchId: string) => set({ matchId }),

      addBall: (ballData) => {
        const state = get();
        const currentInnings = 
          state.currentInnings === 1 ? state.innings1 : 
          state.currentInnings === 2 ? state.innings2 : 
          state.superOver;
        
        if (!currentInnings) return;

        const ball: BallData = {
          ...ballData,
          id: `ball-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          ...calculateBallData(ballData.input, ballData.wicketType, ballData.runs),
        };

        // Update innings state
        const newBalls = [...currentInnings.balls, ball];
        const newOver = ball.isWide || ball.isNoBall 
          ? currentInnings.currentOver 
          : currentInnings.currentBall === 6 
            ? currentInnings.currentOver + 1 
            : currentInnings.currentOver;
        const newBall = ball.isWide || ball.isNoBall
          ? currentInnings.currentBall
          : currentInnings.currentBall === 6
            ? 1
            : currentInnings.currentBall + 1;

        const totalRuns = newBalls.reduce((sum, b) => sum + b.runs, 0);
        const totalWickets = newBalls.filter((b) => b.isWicket).length;
        const totalBalls = newBalls.filter((b) => !b.isWide && !b.isNoBall).length;
        const extras = newBalls.reduce((sum, b) => sum + (b.isWide || b.isNoBall ? b.runs : 0), 0);
        const byes = newBalls.filter((b) => b.isBye).reduce((sum, b) => sum + b.runs, 0);
        const legByes = newBalls.filter((b) => b.isLegBye).reduce((sum, b) => sum + b.runs, 0);
        const wides = newBalls.filter((b) => b.isWide).length;
        const noBalls = newBalls.filter((b) => b.isNoBall).length;

        const updatedInnings: InningsState = {
          ...currentInnings,
          totalRuns,
          totalWickets,
          totalBalls,
          extras,
          byes,
          legByes,
          wides,
          noBalls,
          status: "in_progress",
          currentOver: newOver,
          currentBall: newBall,
          balls: newBalls,
        };

        // Save to history for undo/redo
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push([...newBalls]);
        const newHistoryIndex = newHistory.length - 1;

        // Add to pending sync if offline
        const pendingSync = state.isOnline ? state.pendingSync : [...state.pendingSync, ball];

        const update: Partial<ScoringState> = {
          history: newHistory,
          historyIndex: newHistoryIndex,
          pendingSync,
        };

        if (state.currentInnings === 1) {
          update.innings1 = updatedInnings;
        } else if (state.currentInnings === 2) {
          update.innings2 = updatedInnings;
        } else {
          update.superOver = updatedInnings;
        }

        set(update);
      },

      undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;

        const currentInnings = 
          state.currentInnings === 1 ? state.innings1 : 
          state.currentInnings === 2 ? state.innings2 : 
          state.superOver;
        if (!currentInnings) return;

        const newHistoryIndex = state.historyIndex - 1;
        const previousBalls = state.history[newHistoryIndex] || [];

        // Recalculate innings from previous balls
        const totalRuns = previousBalls.reduce((sum, b) => sum + b.runs, 0);
        const totalWickets = previousBalls.filter((b) => b.isWicket).length;
        const totalBalls = previousBalls.filter((b) => !b.isWide && !b.isNoBall).length;
        const extras = previousBalls.reduce((sum, b) => sum + (b.isWide || b.isNoBall ? b.runs : 0), 0);
        const byes = previousBalls.filter((b) => b.isBye).reduce((sum, b) => sum + b.runs, 0);
        const legByes = previousBalls.filter((b) => b.isLegBye).reduce((sum, b) => sum + b.runs, 0);
        const wides = previousBalls.filter((b) => b.isWide).length;
        const noBalls = previousBalls.filter((b) => b.isNoBall).length;

        const lastBall = previousBalls[previousBalls.length - 1];
        const currentOver = lastBall ? lastBall.overNumber : 0;
        const currentBall = lastBall ? lastBall.ballNumber : 0;

        const updatedInnings: InningsState = {
          ...currentInnings,
          totalRuns,
          totalWickets,
          totalBalls,
          extras,
          byes,
          legByes,
          wides,
          noBalls,
          currentOver,
          currentBall,
          balls: previousBalls,
        };

        const update: Partial<ScoringState> = {
          historyIndex: newHistoryIndex,
        };

        if (state.currentInnings === 1) {
          update.innings1 = updatedInnings;
        } else if (state.currentInnings === 2) {
          update.innings2 = updatedInnings;
        } else {
          update.superOver = updatedInnings;
        }

        set(update);
      },

      redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;

        const currentInnings = 
          state.currentInnings === 1 ? state.innings1 : 
          state.currentInnings === 2 ? state.innings2 : 
          state.superOver;
        if (!currentInnings) return;

        const newHistoryIndex = state.historyIndex + 1;
        const nextBalls = state.history[newHistoryIndex] || [];

        // Recalculate innings from next balls
        const totalRuns = nextBalls.reduce((sum, b) => sum + b.runs, 0);
        const totalWickets = nextBalls.filter((b) => b.isWicket).length;
        const totalBalls = nextBalls.filter((b) => !b.isWide && !b.isNoBall).length;
        const extras = nextBalls.reduce((sum, b) => sum + (b.isWide || b.isNoBall ? b.runs : 0), 0);
        const byes = nextBalls.filter((b) => b.isBye).reduce((sum, b) => sum + b.runs, 0);
        const legByes = nextBalls.filter((b) => b.isLegBye).reduce((sum, b) => sum + b.runs, 0);
        const wides = nextBalls.filter((b) => b.isWide).length;
        const noBalls = nextBalls.filter((b) => b.isNoBall).length;

        const lastBall = nextBalls[nextBalls.length - 1];
        const currentOver = lastBall ? lastBall.overNumber : 0;
        const currentBall = lastBall ? lastBall.ballNumber : 0;

        const updatedInnings: InningsState = {
          ...currentInnings,
          totalRuns,
          totalWickets,
          totalBalls,
          extras,
          byes,
          legByes,
          wides,
          noBalls,
          currentOver,
          currentBall,
          balls: nextBalls,
        };

        const update: Partial<ScoringState> = {
          historyIndex: newHistoryIndex,
        };

        if (state.currentInnings === 1) {
          update.innings1 = updatedInnings;
        } else if (state.currentInnings === 2) {
          update.innings2 = updatedInnings;
        } else {
          update.superOver = updatedInnings;
        }

        set(update);
      },

      setOnline: (online: boolean) => set({ isOnline: online }),

      syncPending: async () => {
        const state = get();
        if (state.pendingSync.length === 0 || !state.isOnline) return;

        // TODO: Implement actual sync with backend
        // For now, just clear pending sync
        set({ pendingSync: [] });
      },

      resetInnings: (innings) => {
        const state = get();
        const currentInnings = 
          innings === 1 ? state.innings1 : 
          innings === 2 ? state.innings2 : 
          state.superOver;
        
        if (currentInnings) {
          const resetInnings: InningsState = {
            ...currentInnings,
            totalRuns: 0,
            totalWickets: 0,
            totalBalls: 0,
            extras: 0,
            byes: 0,
            legByes: 0,
            wides: 0,
            noBalls: 0,
            status: "not_started",
            currentOver: 0,
            currentBall: 0,
            balls: [],
          };

          const update: Partial<ScoringState> = {
            history: [],
            historyIndex: -1,
          };

          if (innings === 1) {
            update.innings1 = resetInnings;
          } else if (innings === 2) {
            update.innings2 = resetInnings;
          } else {
            update.superOver = resetInnings;
          }

          set(update);
        }
      },
    }),
    {
      name: "scoring-storage",
      storage: createJSONStorage(() => {
        // Use IndexedDB for offline storage
        if (typeof window !== "undefined" && "indexedDB" in window) {
          // Fallback to localStorage for now, can be enhanced with idb library
          return localStorage;
        }
        return localStorage;
      }),
      partialize: (state) => ({
        matchId: state.matchId,
        currentInnings: state.currentInnings,
        innings1: state.innings1,
        innings2: state.innings2,
        superOver: state.superOver,
        pendingSync: state.pendingSync,
      }),
    }
  )
);


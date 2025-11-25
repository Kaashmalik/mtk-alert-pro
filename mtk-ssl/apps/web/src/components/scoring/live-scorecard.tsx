"use client";

import { useMemo } from "react";
import { Card } from "@mtk/ui";
import { useScoringStore } from "@/stores/scoring-store";

interface LiveScorecardProps {
  targetRuns?: number;
  totalOvers?: number;
}

export function LiveScorecard({ targetRuns, totalOvers = 20 }: LiveScorecardProps) {
  const currentInnings = useScoringStore((state) => 
    state.currentInnings === 1 ? state.innings1 : 
    state.currentInnings === 2 ? state.innings2 : 
    state.superOver
  );
  const innings1 = useScoringStore((state) => state.innings1);
  const innings2 = useScoringStore((state) => state.innings2);

  const stats = useMemo(() => {
    if (!currentInnings) return null;

    const overs = Math.floor(currentInnings.totalBalls / 6);
    const balls = currentInnings.totalBalls % 6;
    const runRate = currentInnings.totalBalls > 0 
      ? (currentInnings.totalRuns / currentInnings.totalBalls) * 6 
      : 0;
    
    let requiredRate = 0;
    if (targetRuns && currentInnings.totalBalls > 0) {
      const remainingRuns = targetRuns - currentInnings.totalRuns;
      const remainingBalls = (totalOvers * 6) - currentInnings.totalBalls;
      requiredRate = remainingBalls > 0 ? (remainingRuns / remainingBalls) * 6 : 0;
    }

    // Calculate partnership (runs since last wicket)
    const lastWicketIndex = currentInnings.balls
      .map((b, i) => (b.isWicket ? i : -1))
      .filter((i) => i !== -1)
      .pop();
    const partnershipBalls = currentInnings.balls.slice(lastWicketIndex !== undefined ? lastWicketIndex + 1 : 0);
    const partnership = partnershipBalls.reduce((sum, b) => sum + b.runs, 0);

    return {
      overs,
      balls,
      runRate: runRate.toFixed(2),
      requiredRate: requiredRate > 0 ? requiredRate.toFixed(2) : null,
      partnership,
      partnershipBalls: partnershipBalls.length,
    };
  }, [currentInnings, targetRuns, totalOvers]);

  if (!currentInnings || !stats) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground">No innings data</div>
      </Card>
    );
  }

  const isSecondInnings = useScoringStore.getState().currentInnings === 2;
  const displayTarget = isSecondInnings && innings1 ? innings1.totalRuns + 1 : targetRuns;

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* Main Score */}
      <div className="text-center space-y-2">
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
          {currentInnings.totalRuns} / {currentInnings.totalWickets}
        </div>
        <div className="text-lg sm:text-xl text-muted-foreground">
          {stats.overs}.{stats.balls} overs
        </div>
      </div>

      {/* Run Rate & Required Rate */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-xs sm:text-sm text-muted-foreground">Run Rate</div>
          <div className="text-lg sm:text-xl font-semibold">{stats.runRate}</div>
        </div>
        {stats.requiredRate && (
          <div className="text-center">
            <div className="text-xs sm:text-sm text-muted-foreground">Required Rate</div>
            <div className="text-lg sm:text-xl font-semibold">{stats.requiredRate}</div>
          </div>
        )}
        {displayTarget && (
          <div className="text-center col-span-2">
            <div className="text-xs sm:text-sm text-muted-foreground">Target</div>
            <div className="text-lg sm:text-xl font-semibold">{displayTarget}</div>
          </div>
        )}
      </div>

      {/* Partnership */}
      <div className="border-t pt-4">
        <div className="text-center">
          <div className="text-xs sm:text-sm text-muted-foreground">Partnership</div>
          <div className="text-lg sm:text-xl font-semibold">
            {stats.partnership} ({stats.partnershipBalls} balls)
          </div>
        </div>
      </div>

      {/* Extras Breakdown */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
          <div>
            <div className="text-muted-foreground">Wides</div>
            <div className="font-semibold">{currentInnings.wides}</div>
          </div>
          <div>
            <div className="text-muted-foreground">No Balls</div>
            <div className="font-semibold">{currentInnings.noBalls}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Byes</div>
            <div className="font-semibold">{currentInnings.byes}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Leg Byes</div>
            <div className="font-semibold">{currentInnings.legByes}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}


"use client";

import { useMemo } from "react";
import { Card } from "@mtk/ui";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useScoringStore } from "@/stores/scoring-store";

export function WormChart() {
  const currentInnings = useScoringStore((state) => 
    state.currentInnings === 1 ? state.innings1 : 
    state.currentInnings === 2 ? state.innings2 : 
    state.superOver
  );
  const innings1 = useScoringStore((state) => state.innings1);
  const innings2 = useScoringStore((state) => state.innings2);

  const data = useMemo(() => {
    if (!currentInnings) return [];

    // Calculate cumulative runs by ball
    const ballData: { ball: number; runs1: number; runs2: number }[] = [];
    let cumulativeRuns1 = 0;
    let cumulativeRuns2 = 0;

    // Process innings 1
    if (innings1) {
      innings1.balls.forEach((ball, index) => {
        if (!ball.isWide && !ball.isNoBall) {
          cumulativeRuns1 += ball.runs;
          ballData.push({
            ball: index + 1,
            runs1: cumulativeRuns1,
            runs2: 0,
          });
        }
      });
    }

    // Process innings 2
    if (innings2) {
      const maxBall = ballData.length;
      innings2.balls.forEach((ball, index) => {
        if (!ball.isWide && !ball.isNoBall) {
          cumulativeRuns2 += ball.runs;
          const ballNumber = maxBall + index + 1;
          
          const existing = ballData.find((d) => d.ball === ballNumber);
          if (existing) {
            existing.runs2 = cumulativeRuns2;
          } else {
            ballData.push({
              ball: ballNumber,
              runs1: cumulativeRuns1,
              runs2: cumulativeRuns2,
            });
          }
        }
      });
    }

    return ballData;
  }, [currentInnings, innings1, innings2]);

  if (!currentInnings || data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground">No data available</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Worm Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="ball" 
            label={{ value: "Ball", position: "insideBottom", offset: -5 }}
          />
          <YAxis 
            label={{ value: "Runs", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          {innings1 && (
            <Line 
              type="monotone" 
              dataKey="runs1" 
              stroke="#3b82f6" 
              name="Innings 1"
              strokeWidth={2}
            />
          )}
          {innings2 && (
            <Line 
              type="monotone" 
              dataKey="runs2" 
              stroke="#ef4444" 
              name="Innings 2"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}


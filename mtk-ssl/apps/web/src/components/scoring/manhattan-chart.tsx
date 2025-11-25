"use client";

import { useMemo } from "react";
import { Card } from "@mtk/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useScoringStore } from "@/stores/scoring-store";

export function ManhattanChart() {
  const currentInnings = useScoringStore((state) => 
    state.currentInnings === 1 ? state.innings1 : 
    state.currentInnings === 2 ? state.innings2 : 
    state.superOver
  );

  const data = useMemo(() => {
    if (!currentInnings) return [];

    // Group runs by over
    const overMap = new Map<number, number>();
    
    currentInnings.balls.forEach((ball) => {
      if (!ball.isWide && !ball.isNoBall) {
        const over = ball.overNumber;
        const current = overMap.get(over) || 0;
        overMap.set(over, current + ball.runs);
      }
    });

    // Convert to array format
    const maxOver = Math.max(...Array.from(overMap.keys()), 0);
    const chartData = [];
    
    for (let i = 0; i <= maxOver; i++) {
      chartData.push({
        over: i.toString(),
        runs: overMap.get(i) || 0,
      });
    }

    return chartData;
  }, [currentInnings]);

  if (!currentInnings || data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground">No data available</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Manhattan Chart</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="over" 
            label={{ value: "Over", position: "insideBottom", offset: -5 }}
          />
          <YAxis 
            label={{ value: "Runs", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}


"use client";

import { useMemo } from "react";
import { Card } from "@mtk/ui";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useScoringStore } from "@/stores/scoring-store";

// Shot directions for wagon wheel
const SHOT_DIRECTIONS = [
  { name: "Straight", angle: 0, color: "#3b82f6" },
  { name: "Cover", angle: 45, color: "#10b981" },
  { name: "Point", angle: 90, color: "#f59e0b" },
  { name: "Third Man", angle: 135, color: "#ef4444" },
  { name: "Fine Leg", angle: 180, color: "#8b5cf6" },
  { name: "Square Leg", angle: 225, color: "#ec4899" },
  { name: "Mid Wicket", angle: 270, color: "#06b6d4" },
  { name: "Mid Off", angle: 315, color: "#84cc16" },
];

export function WagonWheel() {
  const currentInnings = useScoringStore((state) => 
    state.currentInnings === 1 ? state.innings1 : 
    state.currentInnings === 2 ? state.innings2 : 
    state.superOver
  );

  const data = useMemo(() => {
    if (!currentInnings) return [];

    // Group runs by shot direction
    const directionMap = new Map<string, number>();
    
    currentInnings.balls.forEach((ball) => {
      if (ball.runs > 0 && !ball.isWide && !ball.isNoBall && !ball.isBye && !ball.isLegBye) {
        const direction = ball.shotDirection || "Straight";
        const current = directionMap.get(direction) || 0;
        directionMap.set(direction, current + ball.runs);
      }
    });

    // Convert to chart data format
    return SHOT_DIRECTIONS.map((dir) => ({
      name: dir.name,
      value: directionMap.get(dir.name) || 0,
      color: dir.color,
    })).filter((item) => item.value > 0);
  }, [currentInnings]);

  if (!currentInnings || data.length === 0) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center text-muted-foreground">No shot data available</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-4">Wagon Wheel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}


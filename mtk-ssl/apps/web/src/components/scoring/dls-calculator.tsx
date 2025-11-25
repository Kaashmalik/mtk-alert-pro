"use client";

import { useState } from "react";
import { Button } from "@mtk/ui";
import { Card } from "@mtk/ui";
import { Calculator, X } from "lucide-react";
import { calculateDLS, calculateDLSSecondInnings, DLSResult } from "@/lib/dls-calculator";

interface DLSCalculatorProps {
  targetRuns: number;
  oversCompleted: number;
  totalOvers: number;
  wicketsLost: number;
  runsScored: number;
  onApply: (revisedTarget: number) => void;
}

export function DLSCalculator({
  targetRuns,
  oversCompleted,
  totalOvers,
  wicketsLost,
  runsScored,
  onApply,
}: DLSCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [interruptionOvers, setInterruptionOvers] = useState(oversCompleted);
  const [interruptionWickets, setInterruptionWickets] = useState(wicketsLost);
  const [result, setResult] = useState<DLSResult | null>(null);

  const handleCalculate = () => {
    const dlsResult = calculateDLSSecondInnings({
      targetRuns,
      oversCompleted: interruptionOvers,
      totalOvers,
      wicketsLost: interruptionWickets,
      runsScored,
    });
    setResult(dlsResult);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full sm:w-auto"
      >
        <Calculator className="h-4 w-4 mr-2" />
        DLS Calculator
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">DLS Calculator</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Original Target</label>
            <div className="text-2xl font-bold">{targetRuns}</div>
          </div>

          <div>
            <label className="text-sm font-medium">Overs Completed</label>
            <input
              type="number"
              value={interruptionOvers}
              onChange={(e) => setInterruptionOvers(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              min={0}
              max={totalOvers}
              step={0.1}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Wickets Lost</label>
            <input
              type="number"
              value={interruptionWickets}
              onChange={(e) => setInterruptionWickets(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              min={0}
              max={10}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Runs Scored</label>
            <div className="text-lg font-semibold">{runsScored}</div>
          </div>

          {result && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Revised Target</div>
                <div className="text-3xl font-bold">{result.revisedTarget}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Resources Used</div>
                  <div className="font-semibold">{result.resourcesUsed.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Resources Remaining</div>
                  <div className="font-semibold">{result.resourcesRemaining.toFixed(1)}%</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Par Score: {result.parScore.toFixed(1)}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCalculate} className="flex-1">
              Calculate DLS
            </Button>
            {result && (
              <Button
                onClick={() => {
                  onApply(result.revisedTarget);
                  setIsOpen(false);
                }}
                className="flex-1"
              >
                Apply Target
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


"use client";

import { Button } from "@mtk/ui";
import { WicketType } from "@/stores/scoring-store";
import { X } from "lucide-react";

const WICKET_TYPES: { value: WicketType; label: string; description: string }[] = [
  { value: "bowled", label: "Bowled", description: "Bowler hits the stumps" },
  { value: "caught", label: "Caught", description: "Caught by fielder" },
  { value: "lbw", label: "LBW", description: "Leg Before Wicket" },
  { value: "run_out", label: "Run Out", description: "Run out by fielder" },
  { value: "stumped", label: "Stumped", description: "Stumped by wicketkeeper" },
  { value: "hit_wicket", label: "Hit Wicket", description: "Batsman hits stumps" },
];

interface WicketSelectorProps {
  onSelect: (type: WicketType) => void;
  onCancel: () => void;
}

export function WicketSelector({ onSelect, onCancel }: WicketSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-bold">Select Wicket Type</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {WICKET_TYPES.map((type) => (
            <Button
              key={type.value}
              onClick={() => onSelect(type.value)}
              className="flex flex-col items-start p-3 sm:p-4 h-auto touch-manipulation active:scale-95"
              variant="outline"
            >
              <span className="font-semibold text-sm sm:text-base">{type.label}</span>
              <span className="text-xs text-muted-foreground mt-1">{type.description}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}


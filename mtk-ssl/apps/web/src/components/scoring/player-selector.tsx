"use client";

import { useState } from "react";
import { Button } from "@mtk/ui";
import { Card } from "@mtk/ui";
import { Select } from "@mtk/ui";
import { Player, useMatchPlayers } from "@/hooks/use-match-data";
import { Users, X } from "lucide-react";

interface PlayerSelectorProps {
  matchId: string;
  teamId: string;
  onBatsmanSelect: (playerId: string) => void;
  onBowlerSelect: (playerId: string) => void;
  selectedBatsman?: string;
  selectedBowler?: string;
  selectedBatsman2?: string;
}

export function PlayerSelector({
  matchId,
  teamId,
  onBatsmanSelect,
  onBowlerSelect,
  selectedBatsman,
  selectedBowler,
  selectedBatsman2,
}: PlayerSelectorProps) {
  const { data: playersData, isLoading } = useMatchPlayers(matchId);
  const [showSelector, setShowSelector] = useState(false);
  const [selectingFor, setSelectingFor] = useState<"batsman" | "batsman2" | "bowler" | null>(null);

  if (!playersData) return null;

  const currentTeam = teamId === playersData.teamA[0]?.id ? playersData.teamA : playersData.teamB;
  const otherTeam = teamId === playersData.teamA[0]?.id ? playersData.teamB : playersData.teamA;

  const handleSelect = (playerId: string) => {
    if (selectingFor === "batsman") {
      onBatsmanSelect(playerId);
    } else if (selectingFor === "bowler") {
      onBowlerSelect(playerId);
    }
    setSelectingFor(null);
    setShowSelector(false);
  };

  const getPlayerName = (playerId: string) => {
    const allPlayers = [...currentTeam, ...otherTeam];
    return allPlayers.find((p) => p.id === playerId)?.name || "Select Player";
  };

  return (
    <div className="space-y-4">
      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setSelectingFor("batsman");
            setShowSelector(true);
          }}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
        >
          <Users className="h-4 w-4 mr-2" />
          Batsman: {selectedBatsman ? getPlayerName(selectedBatsman) : "Select"}
        </Button>
        {selectedBatsman2 !== undefined && (
          <Button
            onClick={() => {
              setSelectingFor("batsman2");
              setShowSelector(true);
            }}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
          >
            <Users className="h-4 w-4 mr-2" />
            Batsman 2: {selectedBatsman2 ? getPlayerName(selectedBatsman2) : "Select"}
          </Button>
        )}
        <Button
          onClick={() => {
            setSelectingFor("bowler");
            setShowSelector(true);
          }}
          variant="outline"
          size="sm"
          className="flex-1 sm:flex-none"
        >
          <Users className="h-4 w-4 mr-2" />
          Bowler: {selectedBowler ? getPlayerName(selectedBowler) : "Select"}
        </Button>
      </div>

      {/* Player Selection Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Select {selectingFor === "batsman" || selectingFor === "batsman2" ? "Batsman" : "Bowler"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSelector(false);
                  setSelectingFor(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectingFor === "bowler" ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Bowling Team</h4>
                <div className="grid grid-cols-2 gap-2">
                  {otherTeam.map((player) => (
                    <Button
                      key={player.id}
                      onClick={() => handleSelect(player.id)}
                      variant={selectedBowler === player.id ? "default" : "outline"}
                      className="justify-start"
                    >
                      {player.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Batting Team</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentTeam.map((player) => (
                    <Button
                      key={player.id}
                      onClick={() => handleSelect(player.id)}
                      variant={
                        selectedBatsman === player.id || selectedBatsman2 === player.id
                          ? "default"
                          : "outline"
                      }
                      disabled={selectedBatsman === player.id || selectedBatsman2 === player.id}
                      className="justify-start"
                    >
                      {player.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useScoringStore } from "@/stores/scoring-store";
import { BallInputComponent } from "@/components/scoring/ball-input";
import { LiveScorecard } from "@/components/scoring/live-scorecard";
import { ManhattanChart } from "@/components/scoring/manhattan-chart";
import { WagonWheel } from "@/components/scoring/wagon-wheel";
import { WormChart } from "@/components/scoring/worm-chart";
import { DLSCalculator } from "@/components/scoring/dls-calculator";
import { PlayerSelector } from "@/components/scoring/player-selector";
import { VoiceInput } from "@/components/scoring/voice-input";
import { Button } from "@mtk/ui";
import { Card } from "@mtk/ui";
import { Undo2, Redo2, Wifi, WifiOff, Zap } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { getSocket, disconnectSocket, onBallAdded, offBallAdded } from "@/lib/socket-client";
import { savePendingBall } from "@/lib/offline-sync";
import { useMatch } from "@/hooks/use-match-data";

const queryClient = new QueryClient();

function ScoringInterface() {
  const params = useParams();
  const matchId = params.matchId as string;
  
  const [activeTab, setActiveTab] = useState<"scorecard" | "charts">("scorecard");

  const {
    setMatchId,
    currentInnings: currentInningsNum,
    innings1,
    innings2,
    superOver,
    isOnline,
    undo,
    redo,
    addBall,
    resetInnings,
  } = useScoringStore();

  // Get the actual innings data object
  const currentInningsData = 
    currentInningsNum === 1 ? innings1 : 
    currentInningsNum === 2 ? innings2 : 
    superOver;

  const [selectedBatsman, setSelectedBatsman] = useState<string>();
  const [selectedBatsman2] = useState<string>();
  const [selectedBowler, setSelectedBowler] = useState<string>();

  const { data: match } = useMatch(matchId);

  const currentTeamId = 
    currentInningsNum === 1 ? match?.teamAId : 
    currentInningsNum === 2 ? match?.teamBId : 
    null;

  useOfflineSync();

  useEffect(() => {
    if (!matchId) return;
    
    setMatchId(matchId);
    
    // Initialize innings if not set
    const state = useScoringStore.getState();
    if (!state.innings1) {
      useScoringStore.setState({
        innings1: {
          inningsId: `innings-1-${matchId}`,
          teamId: "", // Should be fetched from match data
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
        },
      });
    }

    // Connect to socket for real-time sync
    if (!isOnline) return;
    
    getSocket(matchId);
    
    const handleBallAdded = (data: unknown) => {
      // Handle incoming ball from other scorers
      console.log("Ball added by another scorer:", data);
    };

    onBallAdded(handleBallAdded);

    return () => {
      offBallAdded(handleBallAdded);
      disconnectSocket();
    };
  }, [matchId, isOnline, setMatchId]);

  const handleBallAdded = async () => {
    const state = useScoringStore.getState();
    const currentInningsState = state.currentInnings === 1 ? state.innings1 : 
      state.currentInnings === 2 ? state.innings2 : 
      state.superOver;
    
    if (currentInningsState) {
      const lastBall = currentInningsState.balls[currentInningsState.balls.length - 1];
      if (lastBall) {
        if (isOnline) {
          // Emit via socket
          const { emitBall } = await import("@/lib/socket-client");
          emitBall(matchId, lastBall);
        } else {
          // Save to offline storage
          await savePendingBall(matchId, lastBall);
        }
      }
    }
  };

  const targetRuns = innings1 && currentInningsNum === 2 ? innings1.totalRuns + 1 : undefined;
  const totalOvers = 20; // Should come from match settings

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Live Scoring</h1>
          <div className="flex items-center gap-2 mt-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Wifi className="h-4 w-4" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-600 text-sm">
                <WifiOff className="h-4 w-4" />
                Offline
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={undo}
            variant="outline"
            size="sm"
            className="touch-manipulation"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={redo}
            variant="outline"
            size="sm"
            className="touch-manipulation"
          >
            <Redo2 className="h-4 w-4 mr-1" />
            Redo
          </Button>
          {currentInningsNum === 2 && targetRuns && (
            <DLSCalculator
              targetRuns={targetRuns}
              oversCompleted={currentInningsData ? Math.floor(currentInningsData.totalBalls / 6) : 0}
              totalOvers={totalOvers}
              wicketsLost={currentInningsData?.totalWickets || 0}
              runsScored={currentInningsData?.totalRuns || 0}
              onApply={(revisedTarget) => {
                // Handle DLS target application
                console.log("DLS target applied:", revisedTarget);
              }}
            />
          )}
          {currentInningsNum === "super_over" && (
            <Button
              onClick={() => resetInnings("super_over")}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-1" />
              Super Over
            </Button>
          )}
        </div>
      </div>

      {/* Innings Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => useScoringStore.setState({ currentInnings: 1 })}
          variant={useScoringStore.getState().currentInnings === 1 ? "default" : "outline"}
          size="sm"
        >
          Innings 1
        </Button>
        <Button
          onClick={() => useScoringStore.setState({ currentInnings: 2 })}
          variant={useScoringStore.getState().currentInnings === 2 ? "default" : "outline"}
          size="sm"
        >
          Innings 2
        </Button>
        <Button
          onClick={() => useScoringStore.setState({ currentInnings: "super_over" })}
          variant={useScoringStore.getState().currentInnings === "super_over" ? "default" : "outline"}
          size="sm"
        >
          Super Over
        </Button>
      </div>

      {/* Live Scorecard */}
      <LiveScorecard targetRuns={targetRuns} totalOvers={totalOvers} />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("scorecard")}
          className={`px-4 py-2 font-medium ${
            activeTab === "scorecard"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Scorecard
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          className={`px-4 py-2 font-medium ${
            activeTab === "charts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Charts
        </button>
      </div>

      {/* Content */}
      {activeTab === "scorecard" ? (
        <div className="space-y-4">
          {/* Player Selection */}
          {currentTeamId && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Player Selection</h2>
              <PlayerSelector
                matchId={matchId}
                teamId={currentTeamId}
                onBatsmanSelect={setSelectedBatsman}
                onBowlerSelect={setSelectedBowler}
                selectedBatsman={selectedBatsman}
                selectedBowler={selectedBowler}
                selectedBatsman2={selectedBatsman2}
              />
            </Card>
          )}

          {/* Voice Input */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Voice Input</h2>
            <VoiceInput
              onCommand={(input) => {
                if (currentInningsData) {
                  const overNumber = currentInningsData.currentOver;
                  const ballNumber = currentInningsData.currentBall === 0 ? 1 : currentInningsData.currentBall;
                  addBall({
                    overNumber,
                    ballNumber,
                    input,
                    runs: typeof input === "number" ? input : input === "WD" || input === "NB" ? 1 : 0,
                    isWicket: input === "W",
                    isWide: input === "WD",
                    isNoBall: input === "NB",
                    isBye: input === "B",
                    isLegBye: input === "LB",
                    batsmanId: selectedBatsman,
                    bowlerId: selectedBowler,
                  });
                  handleBallAdded();
                }
              }}
            />
          </Card>

          {/* Ball Input */}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Ball-by-Ball Input</h2>
            <BallInputComponent 
              batsmanId={selectedBatsman}
              bowlerId={selectedBowler}
              onBallAdded={handleBallAdded} 
            />
          </Card>

          {/* Current Over */}
          {currentInningsData && (
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Current Over</h3>
              <div className="flex gap-2 flex-wrap">
                {currentInningsData.balls
                  .filter((b) => b.overNumber === currentInningsData.currentOver)
                  .map((ball) => (
                    <div
                      key={ball.id}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        ball.isWicket
                          ? "bg-red-500 text-white"
                          : ball.isFour
                          ? "bg-orange-500 text-white"
                          : ball.isSix
                          ? "bg-red-600 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {ball.runs}
                      {ball.isWide && "WD"}
                      {ball.isNoBall && "NB"}
                      {ball.isBye && "B"}
                      {ball.isLegBye && "LB"}
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ManhattanChart />
          <WagonWheel />
          <WormChart />
        </div>
      )}
    </div>
  );
}

export default function ScoringPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScoringInterface />
    </QueryClientProvider>
  );
}


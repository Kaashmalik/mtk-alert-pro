"use client";

import { Button } from "@mtk/ui";
import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { BallInput } from "@/stores/scoring-store";

interface VoiceInputProps {
  onCommand: (input: BallInput) => void;
}

export function VoiceInput({ onCommand }: VoiceInputProps) {
  const { isListening, transcript, error, toggleListening } = useVoiceInput(onCommand);

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Voice input not available: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={toggleListening}
        variant={isListening ? "destructive" : "outline"}
        size="lg"
        className="w-full touch-manipulation"
      >
        {isListening ? (
          <>
            <MicOff className="h-5 w-5 mr-2" />
            Stop Listening
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Start Voice Input
          </>
        )}
      </Button>
      {isListening && (
        <div className="text-center text-sm text-muted-foreground">
          Listening... Say: "zero", "one", "two", "four", "six", "wicket", "wide", etc.
        </div>
      )}
      {transcript && (
        <div className="text-center text-sm font-medium">
          Heard: "{transcript}"
        </div>
      )}
    </div>
  );
}


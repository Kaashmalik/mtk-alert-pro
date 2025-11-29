"use client";

import { useState, useEffect, useRef } from "react";
import { BallInput } from "@/stores/scoring-store";

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

// Add simple type definitions for SpeechRecognition
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      transcript: string;
    }[];
    length: number;
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const VOICE_COMMANDS: Record<string, BallInput> = {
  zero: 0,
  "0": 0,
  one: 1,
  "1": 1,
  two: 2,
  "2": 2,
  three: 3,
  "3": 3,
  four: 4,
  "4": 4,
  six: 6,
  "6": 6,
  wicket: "W",
  w: "W",
  wide: "WD",
  "no ball": "NB",
  "no-ball": "NB",
  bye: "B",
  "leg bye": "LB",
  "leg-bye": "LB",
};

export function useVoiceInput(onCommand: (input: BallInput) => void) {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: "",
    error: null,
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        error: "Speech recognition not supported in this browser",
      }));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      setState((prev) => ({ ...prev, transcript }));

      // Match voice command
      for (const [command, input] of Object.entries(VOICE_COMMANDS)) {
        if (transcript.includes(command)) {
          onCommand(input);
          break;
        }
      }
    };

    recognition.onerror = (event: any) => {
      setState((prev) => ({
        ...prev,
        error: `Speech recognition error: ${event.error}`,
        isListening: false,
      }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand]);

  const startListening = () => {
    if (recognitionRef.current && !state.isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to start voice recognition",
        }));
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
  };
}


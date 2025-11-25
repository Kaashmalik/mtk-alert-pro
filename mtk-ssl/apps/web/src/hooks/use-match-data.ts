"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Match {
  id: string;
  status: string;
  teamAId: string;
  teamBId: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  role: string;
}

export interface MatchTeams {
  teamA: Team;
  teamB: Team;
}

export interface MatchPlayers {
  teamA: Player[];
  teamB: Player[];
}

export function useMatch(matchId: string) {
  return useQuery<Match>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/matches/${matchId}`);
      if (!response.ok) throw new Error("Failed to fetch match");
      return response.json();
    },
    enabled: !!matchId,
  });
}

export function useMatchTeams(matchId: string) {
  return useQuery<MatchTeams>({
    queryKey: ["match-teams", matchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/matches/${matchId}/teams`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
    enabled: !!matchId,
  });
}

export function useMatchPlayers(matchId: string) {
  return useQuery<MatchPlayers>({
    queryKey: ["match-players", matchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/matches/${matchId}/players`);
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
    enabled: !!matchId,
  });
}

export function useStartInnings(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inningsNumber: number;
      teamId: string;
      batsmen: string[];
      bowler: string;
    }) => {
      const response = await fetch(
        `${API_URL}/api/matches/${matchId}/innings/${data.inningsNumber}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to start innings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });
}


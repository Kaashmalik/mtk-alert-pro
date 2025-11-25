import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

interface Player {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
  jerseyNumber?: number;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
}

interface PlayerStats {
  matches: number;
  runs: number;
  wickets: number;
  battingAverage: number;
  strikeRate: number;
  bowlingAverage: number;
  economy: number;
}

export default function PlayerScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const { t } = useTranslation();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId) {
      fetchPlayer();
    }
  }, [playerId]);

  const fetchPlayer = async () => {
    try {
      setLoading(true);
      
      // Fetch player data
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("*, teams(name)")
        .eq("id", playerId)
        .single();

      if (playerError) throw playerError;

      setPlayer({
        id: playerData.id,
        name: playerData.name,
        teamId: playerData.team_id,
        teamName: playerData.teams?.name,
        jerseyNumber: playerData.jersey_number,
        role: playerData.role,
        battingStyle: playerData.batting_style,
        bowlingStyle: playerData.bowling_style,
      });

      // Fetch player stats (this would need to be calculated from match data)
      // For now, using placeholder
      setStats({
        matches: 0,
        runs: 0,
        wickets: 0,
        battingAverage: 0,
        strikeRate: 0,
        bowlingAverage: 0,
        economy: 0,
      });
    } catch (error: any) {
      console.error("Error fetching player:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !player) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Player Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={64} color="#16a34a" />
        </View>
        <Text style={styles.playerName}>{player.name}</Text>
        {player.teamName && (
          <Text style={styles.teamName}>{player.teamName}</Text>
        )}
        {player.jerseyNumber && (
          <Text style={styles.jerseyNumber}>#{player.jerseyNumber}</Text>
        )}
      </View>

      {/* Player Info */}
      <View style={styles.infoCard}>
        {player.role && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t("player.profile")}:</Text>
            <Text style={styles.infoValue}>{player.role}</Text>
          </View>
        )}
        {player.battingStyle && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Batting:</Text>
            <Text style={styles.infoValue}>{player.battingStyle}</Text>
          </View>
        )}
        {player.bowlingStyle && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bowling:</Text>
            <Text style={styles.infoValue}>{player.bowlingStyle}</Text>
          </View>
        )}
      </View>

      {/* Statistics */}
      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>{t("player.stats")}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.matches}</Text>
              <Text style={styles.statLabel}>{t("player.matches")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.runs}</Text>
              <Text style={styles.statLabel}>{t("player.runs")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.wickets}</Text>
              <Text style={styles.statLabel}>{t("player.wickets")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.battingAverage.toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t("player.average")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.strikeRate.toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t("player.strikeRate")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.economy.toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t("player.economy")}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  playerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  teamName: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  jerseyNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#16a34a",
  },
  infoCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  statsCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statItem: {
    width: "30%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    color: "#6b7280",
    padding: 20,
    fontSize: 16,
  },
});


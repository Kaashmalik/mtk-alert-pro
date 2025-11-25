import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useMatchStore } from "@/store/match-store";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { Match } from "@/types";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { liveMatches, upcomingMatches, fetchMatches, loading } = useMatchStore();

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Live Matches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="radio" size={24} color="#ef4444" />
          <Text style={styles.sectionTitle}>{t("live")}</Text>
        </View>
        {loading ? (
          <Text style={styles.loadingText}>{t("loading")}</Text>
        ) : liveMatches.length === 0 ? (
          <Text style={styles.emptyText}>No live matches</Text>
        ) : (
          liveMatches.map((match: Match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchCard}
              onPress={() => router.push(`/match/${match.id}`)}
            >
              <View style={styles.matchHeader}>
                <Text style={styles.matchStatus}>LIVE</Text>
                <View style={styles.liveIndicator} />
              </View>
              <View style={styles.teamsContainer}>
                <View style={styles.teamRow}>
                  <Text style={styles.teamName}>{match.team1Name}</Text>
                  <Text style={styles.score}>
                    {match.team1Score}/{match.team1Wickets} ({match.team1Overs})
                  </Text>
                </View>
                <View style={styles.teamRow}>
                  <Text style={styles.teamName}>{match.team2Name}</Text>
                  <Text style={styles.score}>
                    {match.team2Score}/{match.team2Wickets} ({match.team2Overs})
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Upcoming Matches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={24} color="#16a34a" />
          <Text style={styles.sectionTitle}>{t("upcoming")}</Text>
        </View>
        {upcomingMatches.slice(0, 5).map((match: Match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchCard}
            onPress={() => router.push(`/match/${match.id}`)}
          >
            <View style={styles.teamsContainer}>
              <Text style={styles.teamName}>{match.team1Name}</Text>
              <Text style={styles.vsText}>vs</Text>
              <Text style={styles.teamName}>{match.team2Name}</Text>
            </View>
            {match.scheduledAt && (
              <Text style={styles.scheduledTime}>
                {new Date(match.scheduledAt).toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/matches")}
          >
            <Ionicons name="list" size={24} color="#fff" />
            <Text style={styles.actionText}>{t("matches")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color="#fff" />
            <Text style={styles.actionText}>{t("settings")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  section: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  loadingText: {
    textAlign: "center",
    color: "#6b7280",
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    padding: 20,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  matchStatus: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 12,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  teamsContainer: {
    gap: 8,
  },
  teamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  score: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16a34a",
  },
  vsText: {
    fontSize: 14,
    color: "#6b7280",
    marginVertical: 4,
  },
  scheduledTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#16a34a",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
});


import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useMatchStore } from "@/store/match-store";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { Match } from "@/types";

type Tab = "live" | "upcoming" | "completed";

export default function MatchesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const { liveMatches, upcomingMatches, completedMatches, fetchMatches, loading } =
    useMatchStore();

  useEffect(() => {
    fetchMatches();
  }, []);

  const getMatchesForTab = () => {
    switch (activeTab) {
      case "live":
        return liveMatches;
      case "upcoming":
        return upcomingMatches;
      case "completed":
        return completedMatches;
    }
  };

  const matches = getMatchesForTab();

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "live" && styles.activeTab]}
          onPress={() => setActiveTab("live")}
        >
          <Text
            style={[styles.tabText, activeTab === "live" && styles.activeTabText]}
          >
            {t("live")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}
          >
            {t("upcoming")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}
          >
            {t("completed")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      <ScrollView style={styles.matchesList}>
        {loading ? (
          <Text style={styles.loadingText}>{t("loading")}</Text>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No matches found</Text>
          </View>
        ) : (
          matches.map((match: Match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchCard}
              onPress={() => router.push(`/match/${match.id}`)}
            >
              <View style={styles.matchHeader}>
                {match.status === "live" && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveIndicator} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                )}
                {match.venue && (
                  <Text style={styles.venueText}>
                    <Ionicons name="location" size={14} color="#6b7280" /> {match.venue}
                  </Text>
                )}
              </View>
              <View style={styles.teamsContainer}>
                <View style={styles.teamRow}>
                  <Text style={styles.teamName}>{match.team1Name}</Text>
                  {match.team1Score !== undefined && (
                    <Text style={styles.score}>
                      {match.team1Score}/{match.team1Wickets} ({match.team1Overs})
                    </Text>
                  )}
                </View>
                <View style={styles.teamRow}>
                  <Text style={styles.teamName}>{match.team2Name}</Text>
                  {match.team2Score !== undefined && (
                    <Text style={styles.score}>
                      {match.team2Score}/{match.team2Wickets} ({match.team2Overs})
                    </Text>
                  )}
                </View>
              </View>
              {match.scheduledAt && match.status !== "live" && (
                <Text style={styles.scheduledTime}>
                  {new Date(match.scheduledAt).toLocaleString()}
                </Text>
              )}
              {match.status === "completed" && match.winnerId && (
                <Text style={styles.winnerText}>
                  Winner: {match.winnerId === match.team1Id ? match.team1Name : match.team2Name}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#16a34a",
  },
  tabText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  matchesList: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    color: "#6b7280",
    padding: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 16,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  liveText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "bold",
  },
  venueText: {
    fontSize: 12,
    color: "#6b7280",
  },
  teamsContainer: {
    gap: 12,
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
  scheduledTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16a34a",
    marginTop: 8,
  },
});


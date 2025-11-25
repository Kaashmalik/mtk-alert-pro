import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMatchStore } from "@/store/match-store";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useOfflineStore } from "@/store/offline-store";

export default function MatchScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { t } = useTranslation();
  const { currentMatch, fetchMatch, subscribeToMatch, loading } = useMatchStore();
  const { isOnline } = useOfflineStore();

  useEffect(() => {
    if (matchId) {
      fetchMatch(matchId);
      const unsubscribe = subscribeToMatch(matchId);
      return unsubscribe;
    }
  }, [matchId]);

  if (loading || !currentMatch) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("loading")}</Text>
      </View>
    );
  }

  const calculateRunRate = (runs: number, overs: number) => {
    if (!overs || overs === 0) return "0.00";
    return (runs / overs).toFixed(2);
  };

  const calculateRequiredRunRate = (
    target: number,
    currentScore: number,
    remainingOvers: number
  ) => {
    if (!remainingOvers || remainingOvers === 0) return "0.00";
    const required = target - currentScore;
    return (required / remainingOvers).toFixed(2);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => matchId && fetchMatch(matchId)}
        />
      }
    >
      {/* Match Header */}
      <View style={styles.header}>
        <View style={styles.statusBar}>
          {currentMatch.status === "live" && (
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={14} color="#6b7280" />
              <Text style={styles.offlineText}>{t("offline")}</Text>
            </View>
          )}
        </View>
        {currentMatch.venue && (
          <Text style={styles.venue}>
            <Ionicons name="location" size={16} color="#6b7280" /> {currentMatch.venue}
          </Text>
        )}
      </View>

      {/* Score Card */}
      <View style={styles.scoreCard}>
        {/* Team 1 */}
        <View style={styles.teamCard}>
          <Text style={styles.teamName}>{currentMatch.team1Name}</Text>
          {currentMatch.team1Score !== undefined && (
            <>
              <Text style={styles.score}>
                {currentMatch.team1Score}/{currentMatch.team1Wickets}
              </Text>
              <Text style={styles.overs}>
                ({currentMatch.team1Overs} {t("match.overs")})
              </Text>
              {currentMatch.team1Overs && (
                <Text style={styles.runRate}>
                  RR: {calculateRunRate(currentMatch.team1Score, currentMatch.team1Overs)}
                </Text>
              )}
            </>
          )}
        </View>

        {/* VS Divider */}
        <View style={styles.divider}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Team 2 */}
        <View style={styles.teamCard}>
          <Text style={styles.teamName}>{currentMatch.team2Name}</Text>
          {currentMatch.team2Score !== undefined && (
            <>
              <Text style={styles.score}>
                {currentMatch.team2Score}/{currentMatch.team2Wickets}
              </Text>
              <Text style={styles.overs}>
                ({currentMatch.team2Overs} {t("match.overs")})
              </Text>
              {currentMatch.team2Overs && currentMatch.team1Score !== undefined && (
                <Text style={styles.runRate}>
                  {currentMatch.status === "live" && currentMatch.team1Score
                    ? `RR: ${calculateRunRate(
                        currentMatch.team2Score,
                        currentMatch.team2Overs
                      )} | ${t("match.required")} RR: ${calculateRequiredRunRate(
                        currentMatch.team1Score + 1,
                        currentMatch.team2Score,
                        20 - currentMatch.team2Overs
                      )}`
                    : `RR: ${calculateRunRate(
                        currentMatch.team2Score,
                        currentMatch.team2Overs
                      )}`}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Match Info */}
      <View style={styles.infoCard}>
        {currentMatch.tossWinner && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Toss:</Text>
            <Text style={styles.infoValue}>
              {currentMatch.tossWinner} won the toss and chose to{" "}
              {currentMatch.tossDecision}
            </Text>
          </View>
        )}
        {currentMatch.scheduledAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Scheduled:</Text>
            <Text style={styles.infoValue}>
              {new Date(currentMatch.scheduledAt).toLocaleString()}
            </Text>
          </View>
        )}
        {currentMatch.startedAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Started:</Text>
            <Text style={styles.infoValue}>
              {new Date(currentMatch.startedAt).toLocaleString()}
            </Text>
          </View>
        )}
        {currentMatch.status === "completed" && currentMatch.completedAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completed:</Text>
            <Text style={styles.infoValue}>
              {new Date(currentMatch.completedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
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
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  offlineText: {
    color: "#6b7280",
    fontSize: 12,
  },
  venue: {
    fontSize: 14,
    color: "#6b7280",
  },
  scoreCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamCard: {
    padding: 20,
    alignItems: "center",
  },
  teamName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  score: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 4,
  },
  overs: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 4,
  },
  runRate: {
    fontSize: 14,
    color: "#6b7280",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 12,
    alignItems: "center",
  },
  vsText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
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
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    color: "#6b7280",
    padding: 20,
    fontSize: 16,
  },
});


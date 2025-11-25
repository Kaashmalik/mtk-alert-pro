import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useOfflineStore } from "@/store/offline-store";
import { Ionicons } from "@expo/vector-icons";

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline } = useOfflineStore();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline" size={16} color="#fff" />
      <Text style={styles.text}>{t("offline")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6b7280",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});


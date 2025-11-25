import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../src/lib/i18n";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

export default function RootLayout() {
  useOfflineSync();
  usePushNotifications();
  const router = useRouter();

  useEffect(() => {
    // Handle deep linking
    const handleDeepLink = (event: { url: string }) => {
      const { path } = Linking.parse(event.url);
      
      // Handle ssl.cricket/match/abc format
      if (path?.includes("/match/")) {
        const matchId = path.split("/match/")[1];
        if (matchId) {
          router.push(`/match/${matchId}`);
        }
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "#16a34a",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "Shakir Super League",
            }}
          />
          <Stack.Screen
            name="matches"
            options={{
              title: "Matches",
            }}
          />
          <Stack.Screen
            name="match/[matchId]"
            options={{
              title: "Match",
            }}
          />
          <Stack.Screen
            name="player/[playerId]"
            options={{
              title: "Player Profile",
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


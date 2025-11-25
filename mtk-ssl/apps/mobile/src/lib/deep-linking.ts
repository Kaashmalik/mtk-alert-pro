import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

/**
 * Handle deep links from ssl.cricket/match/abc format
 */
export function useDeepLinking() {
  const router = useRouter();

  const handleDeepLink = (url: string) => {
    const { path, queryParams } = Linking.parse(url);

    // Handle ssl.cricket/match/abc or ssl://match/abc
    if (path?.includes("/match/") || path?.startsWith("match/")) {
      const matchId = path.split("/match/")[1] || path.split("match/")[1];
      if (matchId) {
        router.push(`/match/${matchId}`);
      }
    }

    // Handle ssl.cricket/player/abc
    if (path?.includes("/player/") || path?.startsWith("player/")) {
      const playerId = path.split("/player/")[1] || path.split("player/")[1];
      if (playerId) {
        router.push(`/player/${playerId}`);
      }
    }
  };

  return { handleDeepLink };
}


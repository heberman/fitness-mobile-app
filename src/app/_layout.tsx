import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useSegments, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { syncService } from "../server/services/sync";
import { useUser } from "../hooks/useUser";
import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import { UserProvider } from "../contexts/UserContext";
import { ProfileProvider } from "../contexts/ProfileContext";
import { initDatabase } from "../server/services/schema";
import { dailyTrackingService } from "../server/services/dailyTracking";
import { DailyTrackingProvider } from "../contexts/DailyTrackingContext";

function RootLayoutNav() {
  const { user, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [dbReady, setDbReady] = useState(false);
  const [hasInitialSynced, setHasInitialSynced] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  // Initialize database once on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log("Initializing database...");
        const db = await initDatabase();
        await syncService.init(db);
        await dailyTrackingService.init(db);
        console.log("Services initialized successfully");
        setDbReady(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setInitError(error as Error);
      }
    };
    initApp();
  }, []);

  // Sync only once when user first loads
  useEffect(() => {
    if (!user || !dbReady || hasInitialSynced) return;

    const performInitialSync = async () => {
      try {
        console.log("Performing initial sync...");
        await syncService.fullSync(user.id);
        setHasInitialSynced(true);
        console.log("Initial sync complete");
      } catch (error) {
        console.error("Initial sync failed:", error);
      }
    };

    performInitialSync();
  }, [user, dbReady]);

  // Handle authentication routing
  useEffect(() => {
    if (loading || !dbReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Reset sync flag on logout
      setHasInitialSynced(false);
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, dbReady]);

  // Show error screen if initialization fails
  if (initError) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedText style={{}}>Failed to initialize app</ThemedText>
        <Text style={{ color: "red" }}>{initError.message}</Text>
      </ThemedView>
    );
  }

  // Show loading while initializing or checking auth
  if (loading || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ProfileProvider>
      <DailyTrackingProvider>
        <View style={{ flex: 1 }}>
          <StatusBar />
          <Slot />
        </View>
      </DailyTrackingProvider>
    </ProfileProvider>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutNav />
    </UserProvider>
  );
}

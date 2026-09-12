import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CaseStoreProvider } from "@/lib/store";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CaseStoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.tile },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: colors.tile },
          }}
        >
          <Stack.Screen name="index" options={{ title: "rescore" }} />
          <Stack.Screen name="score" options={{ title: "Your three areas" }} />
          <Stack.Screen name="paywall" options={{ title: "Build the pack" }} />
          <Stack.Screen name="intake" options={{ title: "Your kitchen" }} />
          <Stack.Screen name="plan" options={{ title: "Action plan" }} />
          <Stack.Screen name="confirm" options={{ title: "Confirm the facts" }} />
          <Stack.Screen name="ready" options={{ title: "Readiness check" }} />
          <Stack.Screen name="cases" options={{ title: "Your cases" }} />
        </Stack>
      </CaseStoreProvider>
    </SafeAreaProvider>
  );
}

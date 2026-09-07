import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { I18nProvider } from "@/src/i18n";
import { AuthProvider, useAuth } from "@/src/context/auth-context";
import { DEALLAKAY_API_URL } from "@/src/constants/config";


// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

// Fire-and-forget "wake up" ping the moment the app launches — Render's free
// tier puts the backend to sleep after inactivity, and the first real
// request (e.g. Register's department list) can otherwise arrive before the
// backend has finished waking up and time out. This has nothing to do with
// the app's own auth/data flow, so failures here are silently ignored.
if (DEALLAKAY_API_URL) {
  fetch(DEALLAKAY_API_URL).catch(() => undefined);
}

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // If the CDN is unreachable we fall through on error rather than wedging
  // the app — icons will tofu, but the app still boots.
  if (!loaded && !error) return null;

  return (
    <I18nProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </I18nProvider>
  );
}

/**
 * Auth-gated navigation tree.
 *
 * Stack.Protected mounts ONLY the screens whose guard is currently true —
 * the other group is fully unmounted, not just hidden. This is what makes
 * "Back"/swipe-back structurally impossible between authenticated and
 * unauthenticated screens: there is nothing from the other group left in
 * history to navigate back into, on either side. No manual
 * router.replace()/dismissAll() calls are needed anywhere in the app for
 * this — login/logout just update `user` in AuthContext, and this tree
 * reacts automatically.
 */
function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="create-alert" />
        <Stack.Screen name="alert-details" />
        <Stack.Screen name="my-alerts" />
        <Stack.Screen name="hot-matches" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="messenger" />
        <Stack.Screen name="conversation-details" />
        <Stack.Screen name="notification-details" />
        <Stack.Screen name="alert-settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="alerts-hub" />
        <Stack.Screen name="discover-alerts" />
        <Stack.Screen name="personal-info" />
        <Stack.Screen name="security" />
        <Stack.Screen name="help-support" />
      </Stack.Protected>

      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}

import { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n } from "@/src/i18n";
import { storage } from "@/src/utils/storage";
import { colors, fontSize, spacing, radius, font, shadow } from "@/src/constants/theme";

const ONBOARDING_SEEN_KEY = "dla.onboarding_seen";

// This screen only ever mounts while unauthenticated — Stack.Protected in
// _layout.tsx guarantees that (an authenticated user only ever sees the
// "dashboard" group, never this one). So there's no `user`/`initializing`
// branching needed here at all — just: has onboarding been seen yet?
export default function Index() {
  const { t } = useI18n();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    storage.getItem(ONBOARDING_SEEN_KEY, false).then((seen) => {
      if (!seen) {
        router.replace("/onboarding");
      } else {
        setCheckingOnboarding(false);
      }
    });
  }, []);

  if (checkingOnboarding) {
    return (
      <SafeAreaView style={styles.splash} edges={["top", "bottom"]}>
        <View style={styles.bellBadgeWrap}>
          <View style={styles.bellBadge}>
            <Text style={styles.bellEmoji}>🔔</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.splash} edges={["top", "bottom"]}>
      <View style={styles.splashContent}>
        <View style={styles.bellBadgeWrap}>
          <View style={styles.bellBadge}>
            <Text style={styles.bellEmoji}>🔔</Text>
          </View>
          <View style={styles.bellDot} />
        </View>
        <Text style={styles.splashAppName}>{t("common.appName")}</Text>
        <Text style={styles.splashTagline}>{t("common.tagline")}</Text>
      </View>

      <View style={styles.splashActions}>
        <Pressable
          style={({ pressed }) => [styles.splashPrimaryButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/register")}
          testID="welcome-get-started"
        >
          <Text style={styles.splashPrimaryButtonText}>Kòmanse</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.splashSecondaryButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/login")}
          testID="welcome-login"
        >
          <Text style={styles.splashSecondaryButtonText}>Login</Text>
        </Pressable>
      </View>

      {/* TEMPORARY dev-only control — remove before shipping to real users. */}
      <Pressable
        onPress={async () => {
          await storage.setItem(ONBOARDING_SEEN_KEY, false);
          router.replace("/onboarding");
        }}
        testID="dev-reset-onboarding"
        style={styles.devResetButton}
      >
        <Text style={styles.devResetText}>(Dev) Reset Onboarding</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingRedirect: {
    flex: 1,
    backgroundColor: colors.surfaceInverse,
    alignItems: "center",
    justifyContent: "center",
  },
  splashContent: { alignItems: "center" },
  bellBadgeWrap: { position: "relative", marginBottom: spacing.xl },
  bellBadge: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.raised,
  },
  bellEmoji: { fontSize: 40 },
  bellDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surfaceInverse,
  },
  splashAppName: {
    fontSize: fontSize["2xl"],
    fontFamily: font.medium,
    color: colors.onSurfaceInverse,
    textAlign: "center",
  },
  splashTagline: {
    color: colors.brandTertiary,
    fontSize: fontSize.base,
    fontFamily: font.medium,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  splashActions: { width: "100%", gap: spacing.sm, marginTop: spacing["3xl"] },
  splashPrimaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  splashPrimaryButtonText: { color: colors.brandPrimary, fontSize: fontSize.lg, fontFamily: font.medium },
  splashSecondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.onSurfaceInverse,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  splashSecondaryButtonText: { color: colors.onSurfaceInverse, fontSize: fontSize.lg, fontFamily: font.medium },
  buttonPressed: { opacity: 0.85 },
  devResetButton: { marginTop: spacing.lg, alignItems: "center" },
  devResetText: { color: colors.brandTertiary, fontSize: fontSize.sm, opacity: 0.6 },
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  header: { marginBottom: spacing.xl, alignItems: "center" },
  appName: { fontSize: fontSize["2xl"], fontFamily: font.medium, color: colors.brandPrimary },
  tagline: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.xs },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: colors.onBrandPrimary, fontSize: fontSize.xl, fontFamily: font.medium },
  welcomeTextWrap: { flex: 1 },
  welcomeGreeting: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  welcomeName: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  menuList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuRowPressed: { backgroundColor: colors.surfaceSecondary },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: { color: colors.error, fontSize: fontSize.base, fontFamily: font.medium },
});

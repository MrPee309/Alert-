import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { BottomNav } from "@/src/components/BottomNav";
import { NotificationBell } from "@/src/components/NotificationBell";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function AlertsHubScreen() {
  const { user } = useAuth();
  const isPro = !!(user?.isSeller || user?.isTechnician);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Alèt</Text>
            <Text style={styles.subtitle}>Jere alèt ou yo, dekouvri opòtinite kominote a.</Text>
          </View>
          <NotificationBell />
        </View>

        <Pressable style={styles.primaryCard} onPress={() => router.push("/create-alert")} testID="alerts-hub-create">
          <View style={styles.primaryIconWrap}>
            <Ionicons name="add" size={22} color={colors.onBrandPrimary} />
          </View>
          <View style={styles.primaryTextWrap}>
            <Text style={styles.primaryTitle}>Kreye yon Alèt</Text>
            <Text style={styles.primarySubtitle}>Demann oswa Òf</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.onBrandPrimary} />
        </Pressable>

        <View style={styles.grid}>
          <GridItem icon="list" label="Alèt Ou Yo" onPress={() => router.push("/my-alerts")} testID="alerts-hub-mine" />
          <GridItem icon="flame" label="Hot Matches" onPress={() => router.push("/hot-matches")} testID="alerts-hub-hot" />
        </View>

        {isPro ? (
          <Pressable style={styles.discoverCard} onPress={() => router.push("/discover-alerts")} testID="alerts-hub-discover">
            <Ionicons name="globe-outline" size={20} color={colors.brandPrimary} />
            <View style={styles.primaryTextWrap}>
              <Text style={styles.discoverTitle}>Dekouvri Alèt Kominote a</Text>
              <Text style={styles.discoverSubtitle}>Demann ak Òf ki relevan pou ou</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
          </Pressable>
        ) : (
          <View style={styles.lockedCard}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.onSurfaceTertiary} />
            <Text style={styles.lockedText}>Dekouvèt kominote a disponib pou vandè ak teknisyen sèlman.</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav active="alet" />
    </SafeAreaView>
  );
}

function GridItem({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress} testID={testID}>
      <View style={styles.gridIconWrap}>
        <Ionicons name={icon} size={20} color={colors.brandPrimary} />
      </View>
      <Text style={styles.gridLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTextWrap: { flex: 1 },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },

  primaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.raised,
  },
  primaryIconWrap: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  primaryTextWrap: { flex: 1 },
  primaryTitle: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  primarySubtitle: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm },

  grid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  gridItem: { flex: 1, alignItems: "center", gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  gridIconWrap: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  gridLabel: { fontSize: fontSize.sm, color: colors.onSurface, fontFamily: font.medium },

  discoverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  discoverTitle: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium },
  discoverSubtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },

  lockedCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceTertiary, borderRadius: radius.lg, padding: spacing.lg },
  lockedText: { flex: 1, fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

/**
 * The ONE universal "Fè yon Demand" entry point (Phase 3) — asks "Kisa ou
 * bezwen?" and routes to the category-appropriate flow. Reuses the
 * existing Alert/Demand form (create-alert) and the existing Transport
 * request forms — no new demand system, no duplicate backend.
 */
const OPTIONS = [
  { icon: "cart", label: "Pwodwi", sub: "Telefòn, laptop, pyès...", onPress: () => router.push("/create-alert") },
  { icon: "construct", label: "Teknisyen", sub: "Reparasyon, enstalasyon...", onPress: () => router.push("/create-alert") },
  { icon: "storefront", label: "Biznis / Sèvis", sub: "Restoran, otèl, salon...", onPress: () => router.push("/create-alert") },
  { icon: "bicycle", label: "Transpò", sub: "Mande yon moto taxi", onPress: () => router.push("/request-moto") },
  { icon: "cube", label: "Livrezon", sub: "Voye yon kolis", onPress: () => router.push("/request-delivery") },
  { icon: "earth", label: "Founisè", sub: "Gwo kantite, enpòte", onPress: () => router.push("/create-alert") },
] as const;

export default function MakeADemandScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="make-a-demand-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Fè yon Demand</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>Kisa ou bezwen?</Text>
        <View style={styles.grid}>
          {OPTIONS.map((o, i) => (
            <Pressable key={i} style={styles.card} onPress={o.onPress} testID={`make-a-demand-${o.label.toLowerCase().replace(/[^a-z]/g, "")}`}>
              <View style={styles.cardIcon}><Ionicons name={o.icon as any} size={24} color={colors.brandPrimary} /></View>
              <Text style={styles.cardLabel}>{o.label}</Text>
              <Text style={styles.cardSub}>{o.sub}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  content: { padding: spacing.lg },
  question: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: { width: "47%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, ...shadow.card },
  cardIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  cardLabel: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  cardSub: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
});

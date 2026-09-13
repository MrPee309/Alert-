import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

/**
 * A proper branded category screen for "Transpò & Livrezon" — replaces
 * the earlier native Alert.alert popup with a real page matching the
 * same visual level as the Pwodwi/Teknisyen category screens.
 */
export default function TransportCategoryScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="transport-category-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Transpò & Livrezon</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <LinearGradient colors={[colors.brandPrimary, "#4338CA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoBanner}>
          <Text style={styles.promoTitle}>Transpò & Livrezon</Text>
          <Text style={styles.promoSubtitle}>Deplase oswa voye yon bagay rapidman, ak chofè verifye.</Text>
        </LinearGradient>

        <Pressable style={styles.optionCard} onPress={() => router.push("/request-moto")} testID="transport-category-moto">
          <View style={[styles.optionIcon, { backgroundColor: "#0891B21A" }]}><Ionicons name="bicycle" size={24} color="#0891B2" /></View>
          <View style={styles.optionBody}>
            <Text style={styles.optionTitle}>Moto Taxi</Text>
            <Text style={styles.optionSubtitle}>Jwenn yon moto pou deplase w kounye a.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
        </Pressable>

        <Pressable style={styles.optionCard} onPress={() => router.push("/request-delivery")} testID="transport-category-delivery">
          <View style={[styles.optionIcon, { backgroundColor: "#0891B21A" }]}><Ionicons name="cube" size={24} color="#0891B2" /></View>
          <View style={styles.optionBody}>
            <Text style={styles.optionTitle}>Livrezon</Text>
            <Text style={styles.optionSubtitle}>Voye yon kolis kote w vle.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
        </Pressable>

        <Pressable style={[styles.optionCard, styles.optionCardOutline]} onPress={() => router.push("/become-driver")} testID="transport-category-become-driver">
          <View style={[styles.optionIcon, { backgroundColor: colors.brandTertiary }]}><Ionicons name="person-add" size={24} color={colors.brandPrimary} /></View>
          <View style={styles.optionBody}>
            <Text style={styles.optionTitle}>Vin Chofè Moto</Text>
            <Text style={styles.optionSubtitle}>Enskri pou resevwa demann kliyan yo.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
        </Pressable>

        <Pressable style={styles.historyLink} onPress={() => router.push("/transport-history")} testID="transport-category-history">
          <Ionicons name="time-outline" size={16} color={colors.brandPrimary} />
          <Text style={styles.historyLinkText}>Istwa Transpò Mwen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  content: { padding: spacing.lg },
  promoBanner: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  promoTitle: { fontSize: fontSize.xl, fontFamily: font.medium, color: "#fff" },
  promoSubtitle: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)", marginTop: spacing.xs },
  optionCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  optionCardOutline: { borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" },
  optionIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  optionBody: { flex: 1 },
  optionTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  optionSubtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  historyLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginTop: spacing.lg },
  historyLinkText: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },
});

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function PersonalInfoScreen() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="personal-info-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Enfòmasyon Pèsonèl</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Row icon="person-outline" label="Non Konplè" value={user.fullName} />
          <Row icon="at-outline" label="Non Itilizatè" value={user.username} />
          <Row icon="mail-outline" label="Email" value={user.email} />
          <Row icon="call-outline" label="Telefòn" value={user.phone || "—"} />
          <Row icon="location-outline" label="Peyi" value={user.country} last />
        </View>
        <Text style={styles.note}>Pou modifye enfòmasyon sa yo, ale sou sit DealLakay la.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Ionicons name={icon} size={18} color={colors.onSurfaceTertiary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  title: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"] },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: colors.onSurfaceSecondary, fontSize: fontSize.sm, width: 90 },
  rowValue: { flex: 1, color: colors.onSurface, fontSize: fontSize.sm, textAlign: "right", fontFamily: font.medium },
  note: { color: colors.onSurfaceTertiary, fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.lg },
});

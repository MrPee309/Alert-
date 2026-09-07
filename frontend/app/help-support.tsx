import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function HelpSupportScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="help-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Èd & Sipò</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Row icon="mail-outline" label="Kontakte Sipò" onPress={() => Linking.openURL("mailto:support@deallakay.com")} testID="help-contact" />
          {!!WEBSITE_URL && (
            <Row icon="document-text-outline" label="Kondisyon Itilizasyon" onPress={() => Linking.openURL(`${WEBSITE_URL}/terms`)} testID="help-terms" />
          )}
          {!!WEBSITE_URL && (
            <Row icon="lock-closed-outline" label="Politik Konfidansyalite" onPress={() => Linking.openURL(`${WEBSITE_URL}/privacy`)} testID="help-privacy" last />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress, testID, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; testID?: string; last?: boolean }) {
  return (
    <Pressable style={[styles.row, last && styles.rowLast]} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceTertiary} />
    </Pressable>
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
  rowLabel: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
});

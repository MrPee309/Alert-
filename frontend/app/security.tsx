import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function SecurityScreen() {
  const { user, forgotPassword } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;

  const sendResetLink = async () => {
    setSending(true);
    try {
      await forgotPassword(user.email);
      setSent(true);
    } catch {
      /* the request itself already shows a generic outcome either way */
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="security-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Sekirite</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Ionicons
              name={user.emailVerified ? "checkmark-circle" : "alert-circle-outline"}
              size={20}
              color={user.emailVerified ? colors.success : colors.warning}
            />
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>Email {user.emailVerified ? "Verifye" : "Pa Verifye"}</Text>
              <Text style={styles.statusSubtitle}>{user.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Pressable style={styles.actionRow} onPress={sendResetLink} disabled={sending} testID="security-reset-password">
            <Ionicons name="key-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.actionText}>Chanje Modpas</Text>
            {sending && <ActivityIndicator color={colors.brandPrimary} size="small" />}
          </Pressable>
          {sent && <Text style={styles.confirmation}>Yon lyen voye nan {user.email}.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  title: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium },
  statusSubtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  actionText: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  confirmation: { fontSize: fontSize.sm, color: colors.success, marginTop: spacing.sm },
});

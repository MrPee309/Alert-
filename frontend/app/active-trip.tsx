import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { transportApi, type TransportRequest } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

/**
 * Phase 3 gives just the "matched" confirmation + a way to message the
 * other party — the full trip state machine (arriving/arrived/started/
 * completed, with role-appropriate buttons) is Phase 4, per the phased
 * plan. Intentionally minimal rather than faking buttons that don't yet
 * do anything.
 */
export default function ActiveTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    transportApi.getRequest(id).then(setRequest).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <Text style={styles.title}>Kous sa a pa jwenn.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/dashboard")}><Text style={styles.primaryBtnText}>Retounen Akèy</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.card}>
        <Ionicons name="checkmark-circle" size={40} color={colors.success} style={{ alignSelf: "center", marginBottom: spacing.sm }} />
        <Text style={styles.matchedTitle}>Yon Chofè Aksepte!</Text>
        <Text style={styles.route}>{request.pickup_address} → {request.destination_address}</Text>

        {request.conversation_id && (
          <Pressable
            style={styles.messageBtn}
            onPress={() => router.push({ pathname: "/conversation-details", params: { id: request.conversation_id! } })}
            testID="active-trip-message"
          >
            <Ionicons name="chatbubble" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.messageBtnText}>Voye Mesaj</Text>
          </Pressable>
        )}

        <Text style={styles.note}>Kontwòl kous konplè (Chofè ap Vini, Rive, Kòmanse, Fini) ap vin disponib byento.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary, justifyContent: "center", padding: spacing.lg },
  center: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.base, color: colors.onSurface, textAlign: "center" },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md },
  primaryBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, ...shadow.raised },
  matchedTitle: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface, textAlign: "center" },
  route: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xs },
  messageBtn: { flexDirection: "row", gap: spacing.xs, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.xl },
  messageBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  note: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, textAlign: "center", marginTop: spacing.lg },
});

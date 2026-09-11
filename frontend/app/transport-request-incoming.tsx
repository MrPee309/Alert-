import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { transportApi, type TransportRequest } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function IncomingTransportRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!id) return;
    transportApi.getRequest(id).then(setRequest).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const accept = async () => {
    if (!id) return;
    setActing(true);
    try {
      await transportApi.acceptRequest(id);
      router.replace({ pathname: "/active-trip", params: { id } });
    } catch (e: any) {
      Alert.alert("Kous la pran deja", e?.message || "Yon lòt chofè aksepte demann sa a anvan ou.");
      router.replace("/dashboard");
    } finally {
      setActing(false);
    }
  };

  const reject = async () => {
    if (!id) return;
    setActing(true);
    try { await transportApi.rejectRequest(id); } catch { /* not critical if this fails */ }
    router.replace("/dashboard");
  };

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
        <Text style={styles.title}>Demann sa a pa disponib ankò.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/dashboard")}><Text style={styles.primaryBtnText}>Retounen Akèy</Text></Pressable>
      </SafeAreaView>
    );
  }

  const isDelivery = request.service_type === "delivery";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.card}>
        <Text style={styles.badge}>{isDelivery ? "📦 Nouvo Livrezon" : "🏍️ Nouvo Demann"}</Text>

        <View style={styles.row}>
          <Ionicons name="location" size={18} color={colors.brandPrimary} />
          <View style={styles.rowText}><Text style={styles.rowLabel}>Pikap</Text><Text style={styles.rowValue}>{request.pickup_address}</Text></View>
        </View>
        <View style={styles.row}>
          <Ionicons name="flag" size={18} color={colors.brandPrimary} />
          <View style={styles.rowText}><Text style={styles.rowLabel}>Destinasyon</Text><Text style={styles.rowValue}>{request.destination_address}</Text></View>
        </View>
        {isDelivery ? (
          <View style={styles.row}>
            <Ionicons name="cube" size={18} color={colors.brandPrimary} />
            <View style={styles.rowText}><Text style={styles.rowLabel}>Pake</Text><Text style={styles.rowValue}>{request.package_description || "—"}</Text></View>
          </View>
        ) : (
          <View style={styles.row}>
            <Ionicons name="people" size={18} color={colors.brandPrimary} />
            <View style={styles.rowText}><Text style={styles.rowLabel}>Pasaje</Text><Text style={styles.rowValue}>{request.passenger_count || 1}</Text></View>
          </View>
        )}
        {!!request.notes && (
          <View style={styles.row}>
            <Ionicons name="document-text" size={18} color={colors.brandPrimary} />
            <View style={styles.rowText}><Text style={styles.rowLabel}>Nòt</Text><Text style={styles.rowValue}>{request.notes}</Text></View>
          </View>
        )}

        <View style={styles.btnRow}>
          <Pressable style={styles.rejectBtn} onPress={reject} disabled={acting} testID="incoming-request-reject">
            <Text style={styles.rejectBtnText}>Rejte</Text>
          </Pressable>
          <Pressable style={styles.acceptBtn} onPress={accept} disabled={acting} testID="incoming-request-accept">
            {acting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.acceptBtnText}>Aksepte</Text>}
          </Pressable>
        </View>
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.raised },
  badge: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "flex-start" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  rowValue: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium },
  btnRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  rejectBtn: { flex: 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, alignItems: "center" },
  rejectBtnText: { color: colors.onSurfaceSecondary, fontSize: fontSize.base, fontFamily: font.medium },
  acceptBtn: { flex: 1, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center" },
  acceptBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
});

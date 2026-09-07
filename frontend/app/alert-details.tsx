import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { dealAlertsApi, type DealAlert, type AlertResponse } from "@/src/api/deal-alerts";
import { messagesApi } from "@/src/api/messages";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const CATEGORY_LABELS: Record<string, string> = {
  phone: "Telefòn", laptop: "Laptop", parts: "Pyès", accessories: "Akseswa", tools: "Ekipman",
};

export default function AlertDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [alert, setAlert] = useState<DealAlert | null>(null);
  const [responses, setResponses] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [contactingId, setContactingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await dealAlertsApi.list();
      const found = list.find((a) => a.id === id) || null;
      setAlert(found);
      if (found && found.alert_type === "DEMAND") {
        dealAlertsApi.getResponses(found.id).then(setResponses).catch(() => setResponses([]));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggle = async () => {
    if (!alert) return;
    setBusy(true);
    try {
      await dealAlertsApi.toggle(alert.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!alert) return;
    Alert.alert("Efase Alèt", "Ou sèten ou vle efase alèt sa a?", [
      { text: "Anile", style: "cancel" },
      {
        text: "Efase",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await dealAlertsApi.remove(alert.id);
            router.replace("/dashboard");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const contactResponder = async (userId: string) => {
    setContactingId(userId);
    try {
      const conv = await messagesApi.startDirectConversation(userId);
      router.push({ pathname: "/conversation-details", params: { id: conv.id } });
    } catch {
      /* silent — they can just try again */
    } finally {
      setContactingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <Text style={styles.notFoundText}>Alèt sa a pa jwenn.</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Retounen</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="alert-details-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="notifications" size={30} color={colors.onBrandPrimary} />
        </View>
        <Text style={styles.title}>{alert.keyword || CATEGORY_LABELS[alert.category || ""] || "Alèt"}</Text>
        <View style={[styles.statusBadge, alert.active ? styles.statusActive : styles.statusPaused]}>
          <Text style={[styles.statusText, alert.active ? styles.statusTextActive : styles.statusTextPaused]}>
            {alert.active ? "ACTIVE" : "PAUSED"}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          {alert.keyword && <SummaryRow label="Mo kle" value={alert.keyword} />}
          {alert.category && <SummaryRow label="Kategori" value={CATEGORY_LABELS[alert.category] || alert.category} />}
          {alert.max_price != null && <SummaryRow label="Pri Maksimòm" value={`$${alert.max_price}`} />}
          {(alert.department || alert.city) && (
            <SummaryRow label="Lokasyon" value={[alert.city, alert.department].filter(Boolean).join(", ")} />
          )}
          {!alert.keyword && !alert.category && !alert.max_price && !alert.department && (
            <Text style={styles.summaryEmpty}>Nenpòt kritè — alèt sa a swiv tout pwodwi nouvo.</Text>
          )}
        </View>

        {alert.alert_type === "DEMAND" && (
          <View style={styles.responsesSection}>
            <Text style={styles.responsesTitle}>Repons ({responses.length})</Text>
            {responses.length === 0 ? (
              <Text style={styles.responsesEmpty}>Pa gen repons ankò.</Text>
            ) : (
              responses.map((r) => (
                <View key={r.id} style={styles.responseCard} testID={`alert-response-${r.id}`}>
                  <View style={styles.responseHeaderRow}>
                    <Text style={styles.responseName}>{r.responder_name}</Text>
                    {r.price != null && <Text style={styles.responsePrice}>${r.price}</Text>}
                  </View>
                  <Text style={styles.responseMessage}>{r.message}</Text>
                  <Pressable
                    style={styles.responseContactButton}
                    onPress={() => contactResponder(r.responder_id)}
                    disabled={contactingId === r.responder_id}
                    testID={`alert-response-contact-${r.id}`}
                  >
                    {contactingId === r.responder_id ? (
                      <ActivityIndicator size="small" color={colors.brandPrimary} />
                    ) : (
                      <>
                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.brandPrimary} />
                        <Text style={styles.responseContactButtonText}>Kontakte</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.actionPause]} onPress={toggle} disabled={busy} testID="alert-details-toggle">
            <Ionicons name={alert.active ? "pause" : "play"} size={18} color={colors.onSurface} />
            <Text style={styles.actionText}>{alert.active ? "Pause Alert" : "Resume Alert"}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.actionEdit]}
            onPress={() => router.push({ pathname: "/create-alert", params: { editId: alert.id } })}
            testID="alert-details-edit"
          >
            <Ionicons name="create-outline" size={18} color={colors.brandPrimary} />
            <Text style={[styles.actionText, { color: colors.brandPrimary }]}>Edit Alert</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.actionDelete]} onPress={remove} disabled={busy} testID="alert-details-delete">
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Delete Alert</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loadingContainer: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", gap: spacing.md },
  notFoundText: { color: colors.onSurfaceSecondary, fontSize: fontSize.base },
  backLink: { paddingVertical: spacing.sm },
  backLinkText: { color: colors.brandPrimary, fontSize: fontSize.sm },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  content: { alignItems: "center", padding: spacing.lg },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    ...shadow.raised,
  },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface, textAlign: "center", marginTop: spacing.md },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: spacing.sm },
  statusActive: { backgroundColor: "#DCFCE7" },
  statusPaused: { backgroundColor: colors.surfaceTertiary },
  statusText: { fontSize: fontSize.sm, fontFamily: font.medium, letterSpacing: 0.5 },
  statusTextActive: { color: colors.success },
  statusTextPaused: { color: colors.onSurfaceTertiary },
  summaryCard: { width: "100%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, ...shadow.card },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  summaryLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  summaryValue: { fontSize: fontSize.sm, color: colors.onSurface, fontFamily: font.medium },
  summaryEmpty: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },

  responsesSection: { width: "100%", marginTop: spacing.xl },
  responsesTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.sm },
  responsesEmpty: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center", paddingVertical: spacing.md },
  responseCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  responseHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  responseName: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  responsePrice: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.brandPrimary },
  responseMessage: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.xs },
  responseContactButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm, alignSelf: "flex-start" },
  responseContactButtonText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },

  actions: { width: "100%", gap: spacing.sm, marginTop: spacing.xl },
  actionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.pill, paddingVertical: spacing.md },
  actionPause: { backgroundColor: colors.surface, ...shadow.card },
  actionEdit: { backgroundColor: colors.brandTertiary },
  actionDelete: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error },
  actionText: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium },
});

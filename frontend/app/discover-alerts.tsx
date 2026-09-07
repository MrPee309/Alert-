import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { dealAlertsApi, type DealAlert, type AlertType } from "@/src/api/deal-alerts";
import { messagesApi } from "@/src/api/messages";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const CATEGORY_LABELS: Record<string, string> = {
  phone: "Telefòn", laptop: "Laptop", parts: "Pyès", accessories: "Akseswa", tools: "Ekipman",
};

function alertLabel(a: DealAlert): string {
  return a.keyword || CATEGORY_LABELS[a.category || ""] || "Alèt";
}

export default function DiscoverAlertsScreen() {
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const [filter, setFilter] = useState<AlertType | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<DealAlert | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responsePrice, setResponsePrice] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responseSent, setResponseSent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await dealAlertsApi.discover(filter === "ALL" ? {} : { alertType: filter });
      setAlerts(result);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const contactCreator = async (alertId: string) => {
    setContactingId(alertId);
    try {
      const conv = await messagesApi.contactAlertCreator(alertId);
      router.push({ pathname: "/conversation-details", params: { id: conv.id } });
    } catch {
      /* the alert may have just been deactivated — a silent no-op here is
       * safer than a disruptive error dialog for a background action */
    } finally {
      setContactingId(null);
    }
  };

  const openRespond = (alert: DealAlert) => {
    setRespondingTo(alert);
    setResponseText("");
    setResponsePrice("");
    setResponseSent(false);
  };

  const sendResponse = async () => {
    if (!respondingTo || !responseText.trim()) return;
    setSendingResponse(true);
    try {
      await dealAlertsApi.respond(respondingTo.id, {
        message: responseText.trim(),
        price: responsePrice ? Number(responsePrice) : null,
      });
      setResponseSent(true);
    } catch {
      /* keep the modal open with the typed text so they can retry */
    } finally {
      setSendingResponse(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="discover-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Dekouvèt Kominote a</Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.filterRow}>
        {(["ALL", "DEMAND", "OFFER"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipSelected]}
            onPress={() => setFilter(f)}
            testID={`discover-filter-${f}`}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextSelected]}>
              {f === "ALL" ? "Tout" : f === "DEMAND" ? "Demann" : "Òf"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brandPrimary} size="large" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Pa gen alèt kominote a kounye a.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card} testID={`discover-card-${item.id}`}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.typeBadge, item.alert_type === "OFFER" ? styles.typeBadgeOffer : styles.typeBadgeDemand]}>
                  <Ionicons name={item.alert_type === "OFFER" ? "cube" : "search"} size={12} color={colors.onBrandPrimary} />
                  <Text style={styles.typeBadgeText}>{item.alert_type === "OFFER" ? "ÒF" : "DEMANN"}</Text>
                </View>
                {(item.price != null || item.max_price != null) && (
                  <Text style={styles.cardPrice}>${item.price ?? item.max_price}</Text>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{alertLabel(item)}</Text>
              {!!item.description && <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.cardFooterRow}>
                <Text style={styles.cardMeta}>
                  {item.quantity ? `${item.quantity} · ` : ""}
                  {[item.city, item.department].filter(Boolean).join(", ") || "Tout Ayiti"}
                </Text>
                <Text style={styles.cardCreator}>{item.creator_name} · {item.creator_role}</Text>
              </View>
              <View style={styles.actionRow}>
                {item.alert_type === "DEMAND" && (
                  <Pressable
                    style={styles.respondButton}
                    onPress={() => openRespond(item)}
                    testID={`discover-respond-${item.id}`}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.brandPrimary} />
                    <Text style={styles.respondButtonText}>Reponn</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.contactButton, item.alert_type === "DEMAND" && styles.contactButtonHalf]}
                  onPress={() => contactCreator(item.id)}
                  disabled={contactingId === item.id}
                  testID={`discover-contact-${item.id}`}
                >
                  {contactingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.onBrandPrimary} />
                  ) : (
                    <>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.onBrandPrimary} />
                      <Text style={styles.contactButtonText}>Voye Mesaj</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!respondingTo} transparent animationType="slide" onRequestClose={() => setRespondingTo(null)} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalSheet}>
            {responseSent ? (
              <View style={styles.modalSentWrap}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                <Text style={styles.modalSentTitle}>Repons ou voye!</Text>
                <Text style={styles.modalSentText}>Moun ki poste demann lan ap resevwa yon notifikasyon.</Text>
                <Pressable style={styles.modalCloseButton} onPress={() => setRespondingTo(null)} testID="respond-modal-done">
                  <Text style={styles.modalCloseButtonText}>Fèmen</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reponn a Demann lan</Text>
                  <Pressable onPress={() => setRespondingTo(null)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.onSurfaceSecondary} />
                  </Pressable>
                </View>
                <Text style={styles.modalSubject} numberOfLines={1}>{respondingTo ? alertLabel(respondingTo) : ""}</Text>

                <Text style={styles.modalLabel}>Mesaj ou</Text>
                <TextInput
                  style={styles.modalTextArea}
                  value={responseText}
                  onChangeText={setResponseText}
                  multiline
                  placeholder="Eg. Mwen gen sa disponib, kalite orijinal..."
                  placeholderTextColor={colors.onSurfaceTertiary}
                  testID="respond-modal-message"
                />

                <Text style={styles.modalLabel}>Pri (opsyonèl)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={responsePrice}
                  onChangeText={setResponsePrice}
                  keyboardType="numeric"
                  placeholder="Eg. 45"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  testID="respond-modal-price"
                />

                <Pressable
                  style={[styles.modalSubmit, (!responseText.trim() || sendingResponse) && styles.modalSubmitDisabled]}
                  onPress={sendResponse}
                  disabled={!responseText.trim() || sendingResponse}
                  testID="respond-modal-submit"
                >
                  {sendingResponse ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.modalSubmitText}>Voye Repons</Text>}
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  title: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },

  filterRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  filterChipSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  filterChipText: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  filterChipTextSelected: { color: colors.onBrandPrimary, fontFamily: font.medium },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing["3xl"] },
  emptyText: { color: colors.onSurfaceSecondary, fontSize: fontSize.base },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"] },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadow.card },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  typeBadgeDemand: { backgroundColor: colors.brandPrimary },
  typeBadgeOffer: { backgroundColor: colors.brandSecondary },
  typeBadgeText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  cardPrice: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.brandPrimary },
  cardTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.sm },
  cardDescription: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  cardFooterRow: { marginTop: spacing.sm },
  cardMeta: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary },
  cardCreator: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: 2 },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  contactButtonText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },

  actionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  contactButtonHalf: { flex: 1, marginTop: 0, flexShrink: 1 },
  respondButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  respondButtonText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  modalSubject: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2, marginBottom: spacing.md },
  modalLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  modalTextArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
  },
  modalSubmit: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.lg },
  modalSubmitDisabled: { opacity: 0.5 },
  modalSubmitText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  modalSentWrap: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  modalSentTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  modalSentText: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },
  modalCloseButton: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  modalCloseButtonText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
});

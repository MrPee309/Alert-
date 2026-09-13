import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { transportApi, type TransportRequest } from "@/src/api/transport";
import { reviewsApi } from "@/src/api/reviews";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const POLL_MS = 5000;

const STATUS_LABELS: Record<string, string> = {
  accepted: "🏍️ Chofè a ap vini",
  arrived: "📍 Chofè a rive",
  trip_started: "🚀 Kous la kòmanse",
  trip_completed: "✅ Kous la fini",
  cancelled: "Kous anile",
};

export default function ActiveTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await transportApi.getRequest(id);
      setRequest(r);
    } catch { /* transient — next poll retries */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  const isDriver = !!request && request.matched_driver_id === user?.id;
  const [ratingValue, setRatingValue] = useState(0);
  const [priceInput, setPriceInput] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const submitRating = async () => {
    if (!request || !ratingValue) return;
    setRatingSubmitting(true);
    try {
      await reviewsApi.rateDriver(request.matched_driver_id!, request.id, ratingValue);
      setRatingSubmitted(true);
    } catch (e: any) {
      Alert.alert("Erè", e?.message || "Nou pa t ka voye evalyasyon ou.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const runAction = async (fn: () => Promise<TransportRequest>) => {
    setActing(true);
    try {
      const updated = await fn();
      setRequest(updated);
    } catch (e: any) {
      Alert.alert("Erè", e?.message || "Aksyon an pa t reyisi.");
    } finally {
      setActing(false);
    }
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
        <Text style={styles.title}>Kous sa a pa jwenn.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/dashboard")}><Text style={styles.primaryBtnText}>Retounen Akèy</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.card}>
        <Text style={styles.statusBadge} testID="active-trip-status">{STATUS_LABELS[request.status] || request.status}</Text>
        <Text style={styles.route}>{request.pickup_address} → {request.destination_address}</Text>
        {!!request.package_description && <Text style={styles.meta}>📦 {request.package_description}</Text>}
        {!isDriver && !!request.passenger_count && <Text style={styles.meta}>👤 {request.passenger_count} pasaje</Text>}

        {request.conversation_id && request.status !== "trip_completed" && (
          <Pressable
            style={styles.messageBtn}
            onPress={() => router.push({ pathname: "/conversation-details", params: { id: request.conversation_id! } })}
            testID="active-trip-message"
          >
            <Ionicons name="chatbubble" size={18} color={colors.onBrandPrimary} />
            <Text style={styles.messageBtnText}>Voye Mesaj</Text>
          </Pressable>
        )}

        {/* Price agreement — deliberately NOT a payment system. This only
            RECORDS the number the two sides settled on through Messenger
            (the actual negotiation happens there, reusing existing chat —
            not a separate offer/counter-offer UI). Either side can set it
            before the trip starts; once set, it's shown to both. */}
        {(request.status === "accepted" || request.status === "arrived") && (
          request.agreed_price ? (
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Pri Dakò</Text>
              <Text style={styles.priceValue}>{request.agreed_price.toLocaleString()} Gdes</Text>
            </View>
          ) : (
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Negosye pri a sou Messenger, apre konfime l isit la</Text>
              <View style={styles.priceInputRow}>
                <TextInput
                  style={styles.priceInput}
                  value={priceInput}
                  onChangeText={setPriceInput}
                  placeholder="egzanp: 350"
                  keyboardType="number-pad"
                  testID="active-trip-price-input"
                />
                <Pressable
                  style={styles.priceConfirmBtn}
                  onPress={() => runAction(async () => transportApi.agreePrice(request.id, Number(priceInput)))}
                  disabled={!priceInput || acting}
                  testID="active-trip-price-confirm"
                >
                  <Text style={styles.priceConfirmBtnText}>Konfime</Text>
                </Pressable>
              </View>
            </View>
          )
        )}

        {/* Driver-only lifecycle controls — only the button matching the
            CURRENT status shows, so a step can never be triggered out of
            order from the UI (the backend also guards this either way). */}
        {isDriver && request.status === "accepted" && (
          <Pressable style={styles.actionBtn} onPress={() => runAction(() => transportApi.markArrived(request.id))} disabled={acting} testID="active-trip-arrived">
            {acting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.actionBtnText}>Mwen Rive</Text>}
          </Pressable>
        )}
        {isDriver && request.status === "arrived" && (
          <Pressable style={styles.actionBtn} onPress={() => runAction(() => transportApi.startTrip(request.id))} disabled={acting} testID="active-trip-start">
            {acting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.actionBtnText}>Kòmanse Kous</Text>}
          </Pressable>
        )}
        {isDriver && request.status === "trip_started" && (
          <Pressable style={styles.actionBtn} onPress={() => runAction(() => transportApi.completeTrip(request.id))} disabled={acting} testID="active-trip-complete">
            {acting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.actionBtnText}>Fini Kous</Text>}
          </Pressable>
        )}

        {!isDriver && request.status === "trip_completed" && !ratingSubmitted && (
          <View style={styles.ratingBox}>
            <Text style={styles.ratingPrompt}>Kijan chofè a te ye?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRatingValue(n)} testID={`active-trip-star-${n}`}>
                  <Ionicons name={n <= ratingValue ? "star" : "star-outline"} size={32} color="#FBBF24" />
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.actionBtn, !ratingValue && { opacity: 0.5 }]} onPress={submitRating} disabled={!ratingValue || ratingSubmitting} testID="active-trip-submit-rating">
              {ratingSubmitting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.actionBtnText}>Voye Evalyasyon</Text>}
            </Pressable>
          </View>
        )}

        {request.status === "trip_completed" && (isDriver || ratingSubmitted) && (
          <Pressable style={styles.doneBtn} onPress={() => router.replace("/dashboard")} testID="active-trip-done">
            <Text style={styles.doneBtnText}>Retounen Akèy</Text>
          </Pressable>
        )}

        {!isDriver && (request.status === "accepted" || request.status === "arrived") && (
          <Text style={styles.waitNote}>N ap avize w otomatikman lè estati kous la chanje.</Text>
        )}
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
  statusBadge: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, textAlign: "center" },
  route: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xs },
  meta: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xs },
  messageBtn: { flexDirection: "row", gap: spacing.xs, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.lg },
  messageBtnText: { color: colors.brandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  priceBox: { marginTop: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.md },
  priceLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },
  priceValue: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.brandPrimary, textAlign: "center", marginTop: spacing.xs },
  priceInputRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  priceInput: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: colors.onSurface },
  priceConfirmBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  priceConfirmBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  actionBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.lg },
  actionBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  doneBtn: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.lg },
  doneBtnText: { color: colors.onSurface, fontSize: fontSize.base, fontFamily: font.medium },
  ratingBox: { marginTop: spacing.lg, alignItems: "center" },
  ratingPrompt: { fontSize: fontSize.base, color: colors.onSurface, marginBottom: spacing.sm },
  starRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  waitNote: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, textAlign: "center", marginTop: spacing.lg },
});

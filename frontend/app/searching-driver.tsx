import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { transportApi, type TransportRequest } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font } from "@/src/constants/theme";

const POLL_MS = 4000;

export default function SearchingDriverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<TransportRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    if (!id) return;
    try {
      const r = await transportApi.getRequest(id);
      setRequest(r);
      if (r.status !== "matching") {
        if (pollRef.current) clearInterval(pollRef.current);
        if (r.status === "accepted") {
          router.replace({ pathname: "/active-trip", params: { id: r.id } });
        }
      }
    } catch { /* transient network hiccup — next poll retries */ }
  }, [id]);

  useEffect(() => {
    check();
    pollRef.current = setInterval(check, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [check]);

  const cancel = async () => {
    if (!id) return;
    try {
      await transportApi.cancelRequest(id);
    } catch { /* proceed regardless — user is leaving this screen anyway */ }
    router.replace("/dashboard");
  };

  const retry = () => router.back();

  if (!request) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  if (request.status === "no_driver_found") {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <Ionicons name="sad-outline" size={48} color={colors.onSurfaceTertiary} />
        <Text style={styles.title}>Pa gen chofè disponib kounye a</Text>
        <Text style={styles.sub}>Eseye ankò nan kèk minit, oswa eseye yon lòt kote pikap.</Text>
        <Pressable style={styles.primaryBtn} onPress={retry} testID="searching-retry"><Text style={styles.primaryBtnText}>Eseye Ankò</Text></Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/dashboard")} testID="searching-back-home"><Text style={styles.secondaryBtnText}>Retounen Akèy</Text></Pressable>
      </SafeAreaView>
    );
  }

  if (request.status === "cancelled") {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <Text style={styles.title}>Demann anile</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/dashboard")} testID="searching-back-home2"><Text style={styles.primaryBtnText}>Retounen Akèy</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
      <ActivityIndicator color={colors.brandPrimary} size="large" />
      <Text style={styles.title}>N ap chèche yon chofè toupre w...</Text>
      <Text style={styles.sub}>{request.pickup_address} → {request.destination_address}</Text>
      <Pressable style={styles.cancelBtn} onPress={cancel} testID="searching-cancel"><Text style={styles.cancelBtnText}>Anile</Text></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  title: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, textAlign: "center", marginTop: spacing.sm },
  sub: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md },
  primaryBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  secondaryBtn: { paddingVertical: spacing.sm },
  secondaryBtnText: { color: colors.onSurfaceSecondary, fontSize: fontSize.sm },
  cancelBtn: { marginTop: spacing.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  cancelBtnText: { color: colors.danger ?? "#DC2626", fontSize: fontSize.sm, fontFamily: font.medium },
});

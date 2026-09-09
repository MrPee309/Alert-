import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { transportApi, type DriverProfile, type DriverStatus } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const STATUS_META: Record<DriverProfile["verification_status"], { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: "An Atant Apwobasyon", color: colors.warning ?? "#D97706", icon: "time-outline" },
  verified: { label: "Verifye", color: colors.success, icon: "checkmark-circle" },
  rejected: { label: "Rejte", color: colors.danger ?? "#DC2626", icon: "close-circle" },
  suspended: { label: "Sispann", color: colors.danger ?? "#DC2626", icon: "alert-circle" },
};

export default function DriverDashboardScreen() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notDriver, setNotDriver] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProfile(await transportApi.myDriverProfile());
      setNotDriver(false);
    } catch {
      setNotDriver(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleAvailability = async () => {
    if (!profile) return;
    const next: DriverStatus = profile.status === "available" ? "offline" : "available";
    setUpdating(true);
    try {
      await transportApi.updateStatus(next);
      setProfile({ ...profile, status: next });
    } catch (e: any) {
      Alert.alert("Erè", e?.message || "Nou pa t ka chanje estati ou.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  if (notDriver || !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} testID="driver-dashboard-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
          <Text style={styles.headerTitle}>Dashboard Chofè</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={40} color={colors.onSurfaceTertiary} />
          <Text style={styles.emptyTitle}>Ou poko gen yon pwofil Chofè.</Text>
          <Pressable style={styles.emptyAction} onPress={() => router.push("/become-driver")} testID="driver-dashboard-become">
            <Text style={styles.emptyActionText}>Vin Chofè Moto</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const meta = STATUS_META[profile.verification_status];
  const isVerified = profile.verification_status === "verified";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="driver-dashboard-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Dashboard Chofè</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusCard, { borderColor: meta.color }]} testID="driver-dashboard-verification-status">
          <Ionicons name={meta.icon} size={22} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>

        {!isVerified && (
          <Text style={styles.pendingNote}>
            Ou ap resevwa yon notifikasyon lè admin fin egzamine demann ou. Ou pa ka vin disponib jiskaske sa fèt.
          </Text>
        )}

        {isVerified && (
          <Pressable
            style={[styles.availabilityBtn, profile.status === "available" ? styles.availabilityOn : styles.availabilityOff]}
            onPress={toggleAvailability}
            disabled={updating || profile.status === "busy"}
            testID="driver-dashboard-toggle-availability"
          >
            {updating ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <>
                <View style={[styles.dot, { backgroundColor: profile.status === "available" ? colors.success : colors.onSurfaceTertiary }]} />
                <Text style={styles.availabilityText}>
                  {profile.status === "available" ? "🟢 Disponib — Tape pou Offline" : profile.status === "busy" ? "🟡 Nan yon Kous" : "⚪ Offline — Tape pou Disponib"}
                </Text>
              </>
            )}
          </Pressable>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Motosiklèt</Text>
          <Text style={styles.infoValue}>{profile.motorcycle.brand} {profile.motorcycle.model} — {profile.motorcycle.plate}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Zòn Travay</Text>
          <Text style={styles.infoValue}>{[profile.area, profile.city].filter(Boolean).join(", ")}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Evalyasyon</Text>
          <Text style={styles.infoValue}>{profile.review_count > 0 ? `⭐ ${profile.rating.toFixed(1)} (${profile.review_count})` : "Poko gen evalyasyon"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loadingContainer: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  statusCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1.5, ...shadow.card },
  statusText: { fontSize: fontSize.base, fontFamily: font.medium },
  pendingNote: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.md },
  availabilityBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.pill, paddingVertical: spacing.md, marginTop: spacing.lg },
  availabilityOn: { backgroundColor: colors.brandPrimary },
  availabilityOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  availabilityText: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, ...shadow.card },
  infoLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  infoValue: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium, marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.base, color: colors.onSurface, textAlign: "center" },
  emptyAction: { marginTop: spacing.md, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyActionText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
});

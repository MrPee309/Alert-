import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Switch, ActivityIndicator, Animated } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { dealAlertsApi } from "@/src/api/deal-alerts";
import { registerForPush, unregisterFromPush, getPushEnabledLocally } from "@/src/services/push-service";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function AlertSettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState("");
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const toastOpacity = useState(new Animated.Value(0))[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [enabled, alerts] = await Promise.all([getPushEnabledLocally(), dealAlertsApi.list()]);
      setPushEnabled(enabled);
      setTotalCount(alerts.length);
      setActiveCount(alerts.filter((a) => a.active).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const showToast = (message: string) => {
    setToast(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const togglePush = async (next: boolean) => {
    setPushBusy(true);
    setPushNote("");
    try {
      if (next) {
        const result = await registerForPush();
        if (result.status === "registered") {
          setPushEnabled(true);
          showToast("Paramèt yo anrejistre.");
        } else if (result.status === "denied") {
          setPushNote("Ou dwe otorize notifikasyon nan Paramèt telefòn ou.");
        } else if (result.status === "unsupported") {
          setPushNote("Push pa disponib sou aparèy sa a (Expo Go/simulateur).");
        } else {
          setPushNote("Nou pa kapab anrejistre paramèt yo.");
        }
      } else {
        const ok = await unregisterFromPush();
        setPushEnabled(false);
        if (ok) showToast("Paramèt yo anrejistre.");
        else setPushNote("Nou pa kapab anrejistre paramèt yo.");
      }
    } finally {
      setPushBusy(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="alert-settings-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Paramèt Alèt</Text>
        <Text style={styles.subtitle}>Kontwole fason DealLakay voye alèt ak notifikasyon ba ou.</Text>

        <Text style={styles.sectionTitle}>NOTIFIKASYON</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="notifications" size={18} color={colors.brandPrimary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Resevwa nouvo alèt sou telefòn ou.</Text>
            </View>
            {pushBusy ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : (
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={{ false: colors.border, true: colors.brandPrimary }}
                thumbColor={colors.surface}
                ios_backgroundColor={colors.border}
                testID="alert-settings-push-toggle"
              />
            )}
          </View>
          {!!pushNote && <Text style={styles.settingNote}>{pushNote}</Text>}
        </View>

        <Text style={styles.sectionTitle}>ALÈT</Text>
        <Pressable style={styles.sectionCard} onPress={() => router.push("/my-alerts")} testID="alert-settings-manage-alerts">
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="list" size={18} color={colors.brandPrimary} />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingTitle}>Jere Alèt Yo</Text>
              <Text style={styles.settingDescription}>{activeCount} aktif sou {totalCount} total</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
          </View>
        </Pressable>
      </ScrollView>

      {!!toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loadingContainer: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, fontFamily: font.medium, letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.lg },
  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  settingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  settingIconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  settingTextWrap: { flex: 1 },
  settingTitle: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium },
  settingDescription: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  settingNote: { fontSize: fontSize.sm, color: colors.error, marginTop: spacing.sm, marginLeft: 44 },

  toast: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
    ...shadow.raised,
  },
  toastText: { color: colors.onSurfaceInverse, fontSize: fontSize.sm, fontFamily: font.medium },
});

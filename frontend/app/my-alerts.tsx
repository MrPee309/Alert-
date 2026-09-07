import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { dealAlertsApi, type DealAlert } from "@/src/api/deal-alerts";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const CATEGORY_LABELS: Record<string, string> = {
  phone: "Telefòn", laptop: "Laptop", parts: "Pyès", accessories: "Akseswa", tools: "Ekipman",
};

function alertLabel(a: DealAlert): string {
  return a.keyword || CATEGORY_LABELS[a.category || ""] || "Alèt";
}

export default function MyAlertsScreen() {
  const [alerts, setAlerts] = useState<DealAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setAlerts(await dealAlertsApi.list());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="my-alerts-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Alèt Mwen</Text>
        <Pressable style={styles.iconButton} onPress={() => router.push("/create-alert")} testID="my-alerts-add" hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brandPrimary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Ou pa gen okenn alèt ankò.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push({ pathname: "/alert-details", params: { id: item.id } })}
            testID={`my-alerts-card-${item.id}`}
          >
            <View style={[styles.statusDot, item.active ? styles.statusDotActive : styles.statusDotPaused]} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{alertLabel(item)}</Text>
              <Text style={styles.cardMeta}>
                {item.max_price ? `Max: $${item.max_price} · ` : ""}
                {[item.department, item.city].filter(Boolean).join(", ") || "Tout Ayiti"}
              </Text>
            </View>
            <Text style={[styles.statusLabel, item.active ? styles.statusLabelActive : styles.statusLabelPaused]}>
              {item.active ? "ACTIVE" : "PAUSED"}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loadingContainer: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  title: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"] },
  emptyState: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyText: { color: colors.onSurfaceSecondary, fontSize: fontSize.base },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  statusDot: { width: 8, height: 8, borderRadius: radius.pill },
  statusDotActive: { backgroundColor: colors.success },
  statusDotPaused: { backgroundColor: colors.onSurfaceTertiary },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  cardMeta: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  statusLabel: { fontSize: fontSize.sm, fontFamily: font.medium },
  statusLabelActive: { color: colors.success },
  statusLabelPaused: { color: colors.onSurfaceTertiary },
});

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { alertsApi } from "@/src/api/alerts";
import type { AppNotification } from "@/src/types";
import { colors, spacing, radius, fontSize, font } from "@/src/constants/theme";
import { BottomNav } from "@/src/components/BottomNav";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "kounye a";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}è`;
  return `${Math.floor(hrs / 24)}j`;
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setItems(await alertsApi.getNotifications());
    } catch (e: any) {
      setError(e?.message || "Erè pandan chajman notifikasyon yo.");
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

  const markAllRead = async () => {
    setItems((cur) => cur.map((n) => ({ ...n, read: true })));
    try {
      await alertsApi.markAllRead();
    } catch {
      /* optimistic */
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifikasyon</Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAllRead} testID="mark-all-read">
            <Text style={styles.markAllText}>Make tout li</Text>
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brandPrimary} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Pa gen notifikasyon.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => router.push({ pathname: "/notification-details", params: { id: item.id } })}
            testID={`notification-${item.id}`}
          >
            {!item.read && <View style={styles.dot} />}
            <View style={styles.cardBody}>
              <Text style={styles.cardMessage} numberOfLines={3}>{item.message}</Text>
              <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
            </View>
          </Pressable>
        )}
      />
      <BottomNav active="notifikasyon" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: spacing["3xl"] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },
  markAllText: { color: colors.brandPrimary, fontSize: fontSize.sm },
  error: { color: colors.error, fontSize: fontSize.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing["2xl"] },
  emptyText: { color: colors.onSurfaceSecondary, fontSize: fontSize.base, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: { backgroundColor: colors.brandTertiary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary, marginTop: 6 },
  cardBody: { flex: 1 },
  cardMessage: { fontSize: fontSize.base, color: colors.onSurface },
  cardTime: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: spacing.xs },
});

import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { transportApi, type TransportRequest } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const STATUS_META: Record<string, { label: string; color: string }> = {
  trip_completed: { label: "Fini", color: colors.success },
  cancelled: { label: "Anile", color: colors.onSurfaceTertiary },
  no_driver_found: { label: "Pa Jwenn Chofè", color: colors.onSurfaceTertiary },
};

export default function TransportHistoryScreen() {
  const [items, setItems] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      transportApi.history().then(setItems).catch(() => {}).finally(() => setLoading(false));
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="transport-history-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Istwa Transpò</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={40} color={colors.onSurfaceTertiary} />
          <Text style={styles.emptyText}>Ou poko gen okenn kous nan istwa ou.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const meta = STATUS_META[item.status] || { label: item.status, color: colors.onSurfaceTertiary };
            return (
              <View style={styles.card} testID={`transport-history-${item.id}`}>
                <Ionicons name={item.service_type === "delivery" ? "cube" : "bicycle"} size={20} color={colors.brandPrimary} />
                <View style={styles.cardBody}>
                  <Text style={styles.route}>{item.pickup_address} → {item.destination_address}</Text>
                  <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("fr-HT")}</Text>
                </View>
                <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  emptyText: { fontSize: fontSize.base, color: colors.onSurfaceSecondary },
  listContent: { padding: spacing.lg },
  card: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  cardBody: { flex: 1 },
  route: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  date: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: 2 },
  statusLabel: { fontSize: fontSize.sm, fontFamily: font.medium },
});

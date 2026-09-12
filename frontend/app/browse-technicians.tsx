import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image, Linking } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { techniciansApi, type DealLakayTechnician } from "@/src/api/technicians";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function BrowseTechniciansScreen() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<DealLakayTechnician[]>([]);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await techniciansApi.list({ q: q || undefined, sort: "recommended" });
      setItems(res.technicians);
    } catch { /* keep last results on transient failure */ } finally {
      setLoading(false);
    }
  }, []);

  // Loads the FULL technician list by default (no query) — matches "tout
  // teknisyen nèt an jeneral", not just search-triggered results.
  useFocusEffect(useCallback(() => { search(query); }, []));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-technicians-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Teknisyen</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search(query)}
          placeholder="Non, espesyalite, vil..."
          returnKeyType="search"
          testID="browse-technicians-search-input"
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="construct-outline" size={40} color={colors.onSurfaceTertiary} />
          <Text style={styles.emptyText}>Pa gen teknisyen ki matche rechèch ou a.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/technician/${item.username}`)}
              testID={`browse-technician-${item.username}`}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}><Ionicons name="person" size={20} color={colors.onSurfaceTertiary} /></View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  {item.technician_verified && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
                </View>
                <Text style={styles.specialties} numberOfLines={1}>{item.specialties.join(", ") || "—"}</Text>
                <Text style={styles.location}>{item.city}{item.review_count > 0 ? ` · ⭐ ${item.rating.toFixed(1)} (${item.review_count})` : ""}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  emptyText: { fontSize: fontSize.base, color: colors.onSurfaceSecondary },
  listContent: { padding: spacing.lg },
  card: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  avatar: { width: 48, height: 48, borderRadius: radius.pill },
  avatarPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  specialties: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  location: { fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 },
});

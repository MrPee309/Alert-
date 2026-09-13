import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image, Linking } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { techniciansApi, type DealLakayTechnician } from "@/src/api/technicians";
import { useAuth } from "@/src/context/auth-context";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

// Mirrors the real, backend-validated SPECIALTIES list in
// routers/technicians.py — filtering by anything not in this list would
// always return zero results, since no technician profile could ever
// have that value.
const SPECIALTIES = [
  { value: "", label: "Tout" },
  { value: "Reparasyon Telefòn", label: "Telefòn" },
  { value: "Reparasyon Laptop", label: "Laptop" },
  { value: "Mekanisyen", label: "Mekanisyen" },
  { value: "Plonbye", label: "Plonbye" },
  { value: "Elektrisyen", label: "Elektrisyen" },
  { value: "Klimatizasyon", label: "Klimatizasyon" },
  { value: "Konstriksyon", label: "Konstriksyon" },
];

export default function BrowseTechniciansScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [nearMeOnly, setNearMeOnly] = useState(true);
  const [items, setItems] = useState<DealLakayTechnician[]>([]);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const search = useCallback(async (q: string, spec: string, nearMe: boolean) => {
    setLoading(true);
    try {
      // "Pi pre kliyan" — no GPS coordinates exist for technician profiles
      // yet (only city/department text), so proximity is approximated by
      // matching the client's own registered city rather than faking a
      // real distance calculation.
      const res = await techniciansApi.list({ q: q || undefined, specialty: spec || undefined, city: nearMe && user?.city ? user.city : undefined, sort: "recommended" });
      setItems(res.technicians);
    } catch { /* keep last results on transient failure */ } finally {
      setLoading(false);
    }
  }, []);

  // Loads the FULL technician list by default (no query) — matches "tout
  // teknisyen nèt an jeneral", not just search-triggered results.
  useFocusEffect(useCallback(() => { search(query, specialty, nearMeOnly); }, []));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-technicians-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Teknisyen</Text>
        <Pressable onPress={() => router.push("/create-alert")} testID="browse-technicians-demand">
          <Ionicons name="megaphone-outline" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search(query, specialty, nearMeOnly)}
          placeholder="Non, espesyalite, vil..."
          returnKeyType="search"
          testID="browse-technicians-search-input"
        />
      </View>

      <View style={styles.chipRow}>
        {SPECIALTIES.map((s) => (
          <Pressable
            key={s.value}
            style={[styles.chip, specialty === s.value && styles.chipActive]}
            onPress={() => { setSpecialty(s.value); search(query, s.value, nearMeOnly); }}
            testID={`browse-technicians-specialty-${s.value || "all"}`}
          >
            <Text style={[styles.chipText, specialty === s.value && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {!!user?.city && (
        <Pressable
          style={styles.nearMeToggle}
          onPress={() => { const next = !nearMeOnly; setNearMeOnly(next); search(query, specialty, next); }}
          testID="browse-technicians-near-me-toggle"
        >
          <Ionicons name={nearMeOnly ? "checkbox" : "square-outline"} size={18} color={nearMeOnly ? colors.brandPrimary : colors.onSurfaceTertiary} />
          <Text style={styles.nearMeToggleText}>Toupre {user.city} sèlman</Text>
        </Pressable>
      )}

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
              <Pressable
                onPress={() => { techniciansApi.toggleFavorite(item.username).catch(() => {}); setFavorited((f) => ({ ...f, [item.username]: !f[item.username] })); }}
                testID={`browse-technician-favorite-${item.username}`}
              >
                <Ionicons name={favorited[item.username] ? "heart" : "heart-outline"} size={20} color={favorited[item.username] ? "#EF4444" : colors.onSurfaceTertiary} />
              </Pressable>
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: fontSize.sm, color: colors.onSurface },
  chipTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  nearMeToggle: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  nearMeToggleText: { fontSize: fontSize.sm, color: colors.onSurface },
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

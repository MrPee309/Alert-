import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image, Linking, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { techniciansApi, type DealLakayTechnician } from "@/src/api/technicians";
import { notifyMeApi } from "@/src/api/notify-me";
import { useAuth } from "@/src/context/auth-context";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

// Mirrors the real, backend-validated SPECIALTIES list in
// routers/technicians.py — filtering by anything not in this list would
// always return zero results, since no technician profile could ever
// have that value.
const SPECIALTIES = [
  { value: "", label: "Tout", icon: "apps" as const },
  { value: "Reparasyon Telefòn", label: "Telefòn", icon: "phone-portrait" as const },
  { value: "Reparasyon Laptop", label: "Laptop", icon: "laptop" as const },
  { value: "Mekanisyen", label: "Mekanisyen", icon: "car" as const },
  { value: "Elektrisyen Machin", label: "Elek. Machin", icon: "car-sport" as const },
  { value: "Reparasyon Moto", label: "Moto", icon: "bicycle" as const },
  { value: "Plonbye", label: "Plonbye", icon: "water" as const },
  { value: "Elektrisyen", label: "Elektrisyen", icon: "flash" as const },
  { value: "Klimatizasyon", label: "Klimatizasyon", icon: "snow" as const },
  { value: "Konstriksyon", label: "Konstriksyon", icon: "hammer" as const },
  { value: "Chapant (Bwa)", label: "Chapant", icon: "construct" as const },
  { value: "Mason", label: "Mason", icon: "business" as const },
  { value: "Penti (Kay)", label: "Penti", icon: "color-palette" as const },
  { value: "Soude (Welding)", label: "Soude", icon: "flame" as const },
  { value: "Jadinaj", label: "Jadinaj", icon: "leaf" as const },
  { value: "Netwayaj", label: "Netwayaj", icon: "sparkles" as const },
  { value: "Kouti", label: "Kouti", icon: "cut" as const },
];

/** Same organization level as browse-products.tsx: gradient promo banner
 * + filter chips + a live section title with count, all as the FlatList
 * header — so the full result list shows immediately, no separate
 * "popular preview vs full list" split here either. */
export default function BrowseTechniciansScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [nearMeOnly, setNearMeOnly] = useState(true);
  const [items, setItems] = useState<DealLakayTechnician[]>([]);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string, spec: string, nearMe: boolean) => {
    setLoading(true);
    setError(null);
    try {
      // "Pi pre kliyan" — no GPS coordinates exist for technician profiles
      // yet (only city/department text), so proximity is approximated by
      // matching the client's own registered city rather than faking a
      // real distance calculation.
      const res = await techniciansApi.list({ q: q || undefined, specialty: spec || undefined, city: nearMe && user?.city ? user.city : undefined, sort: "recommended" });
      setItems(res.technicians);
    } catch (e: any) {
      // FIXED: this used to silently swallow any error, leaving "items"
      // at its previous (often empty) value with no indication anything
      // went wrong — showed as "no technicians" even for a real failure.
      setError(e?.message || "Nou pa t ka chaje teknisyen yo.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { search(query, specialty, nearMeOnly); }, [specialty, nearMeOnly]));

  const selectSpecialty = (spec: string) => { setSpecialty(spec); search(query, spec, nearMeOnly); };
  const toggleNearMe = () => { const next = !nearMeOnly; setNearMeOnly(next); search(query, specialty, next); };

  const header = (
    <>
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

      <LinearGradient colors={[colors.brandPrimary, "#4338CA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoBanner}>
        <Text style={styles.promoTitle}>Tout Teknisyen</Text>
        <Text style={styles.promoSubtitle}>Jwenn yon teknisyen verifye pou nenpòt sèvis ou bezwen.</Text>
      </LinearGradient>

      <View style={styles.chipRow}>
        {SPECIALTIES.map((s) => (
          <Pressable
            key={s.value}
            style={[styles.chip, specialty === s.value && styles.chipActive]}
            onPress={() => selectSpecialty(s.value)}
            testID={`browse-technicians-specialty-${s.value || "all"}`}
          >
            <Ionicons name={s.icon} size={14} color={specialty === s.value ? colors.onBrandPrimary : colors.brandPrimary} />
            <Text style={[styles.chipText, specialty === s.value && styles.chipTextActive]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      {!!user?.city && (
        <Pressable style={styles.nearMeToggle} onPress={toggleNearMe} testID="browse-technicians-near-me-toggle">
          <Ionicons name={nearMeOnly ? "checkbox" : "square-outline"} size={18} color={nearMeOnly ? colors.brandPrimary : colors.onSurfaceTertiary} />
          <Text style={styles.nearMeToggleText}>Toupre {user.city} sèlman</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>
        {specialty ? SPECIALTIES.find((s) => s.value === specialty)?.label : "Tout Teknisyen"}
        {!loading ? ` (${items.length})` : ""}
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-technicians-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Teknisyen</Text>
        <Pressable onPress={() => router.push("/create-alert")} testID="browse-technicians-demand">
          <Ionicons name="megaphone-outline" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={header}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyBox}>
                <Ionicons name="warning-outline" size={40} color="#DC2626" />
                <Text style={[styles.emptyText, { color: "#DC2626" }]}>{error}</Text>
                <Pressable style={styles.notifyMeBtn} onPress={() => search(query, specialty, nearMeOnly)} testID="browse-technicians-retry">
                  <Ionicons name="refresh" size={16} color={colors.brandPrimary} />
                  <Text style={styles.notifyMeBtnText}>Eseye Ankò</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="construct-outline" size={40} color={colors.onSurfaceTertiary} />
                <Text style={styles.emptyText}>Pa gen teknisyen ki matche rechèch ou a.</Text>
                <Pressable
                  style={styles.notifyMeBtn}
                  onPress={() => {
                    notifyMeApi.subscribe({ kind: "technician", specialty: specialty || undefined }).catch(() => {});
                    Alert.alert("Nap Avize W", "N ap avize w lè yon teknisyen disponib pou espesyalite sa a.");
                  }}
                  testID="browse-technicians-notify-me"
                >
                  <Ionicons name="notifications-outline" size={16} color={colors.brandPrimary} />
                  <Text style={styles.notifyMeBtnText}>Avèti mwen lè li disponib</Text>
                </Pressable>
              </View>
            )
          }
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
                <Ionicons name={favorited[item.username] ? "heart" : "heart-outline"} size={20} color={favorited[item.username] ? colors.error : colors.onSurfaceTertiary} />
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  promoBanner: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  promoTitle: { fontSize: fontSize.xl, fontFamily: font.medium, color: "#fff" },
  promoSubtitle: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)", marginTop: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: fontSize.sm, color: colors.onSurface },
  chipTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  nearMeToggle: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  nearMeToggleText: { fontSize: fontSize.sm, color: colors.onSurface },
  sectionTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.sm },
  emptyBox: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { fontSize: fontSize.base, color: colors.onSurfaceSecondary },
  notifyMeBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderWidth: 1, borderColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  notifyMeBtnText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  card: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  avatar: { width: 48, height: 48, borderRadius: radius.pill },
  avatarPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  name: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  specialties: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  location: { fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 },
});

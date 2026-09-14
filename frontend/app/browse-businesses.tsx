import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image, Linking, Alert } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { businessesApi, type DealLakayBusiness } from "@/src/api/businesses";
import { notifyMeApi } from "@/src/api/notify-me";
import { useAuth } from "@/src/context/auth-context";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

// Mirrors the real, backend-validated BUSINESS_TYPES list in
// routers/businesses.py — same pattern as the Teknisyen specialty chips.
const BUSINESS_TYPES = [
  { value: "", label: "Tout", icon: "apps" as const },
  { value: "Otèl", label: "Otèl", icon: "bed" as const },
  { value: "Restoran", label: "Restoran", icon: "restaurant" as const },
  { value: "Garaj / Mekanisyen", label: "Garaj", icon: "car" as const },
  { value: "Famasi", label: "Famasi", icon: "medkit" as const },
  { value: "Estidyo", label: "Estidyo", icon: "camera" as const },
  { value: "Salon Bòte", label: "Salon", icon: "cut" as const },
  { value: "Sant Sèvis", label: "Sant Sèvis", icon: "business" as const },
  { value: "Magazen", label: "Magazen", icon: "storefront" as const },
  { value: "Lekòl", label: "Lekòl", icon: "school" as const },
];

/** Same organization level as browse-technicians.tsx / browse-products.tsx:
 * gradient promo banner + filter chips + a live count title, full list
 * shown immediately (no separate preview screen). */
export default function BrowseBusinessesScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [items, setItems] = useState<DealLakayBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await businessesApi.list({ q: q || undefined, business_type: type || undefined, city: user?.city || undefined });
      setItems(res.businesses);
    } catch (e: any) {
      setError(e?.message || "Nou pa t ka chaje biznis lokal yo.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { search(query, businessType); }, [businessType]));

  const selectType = (type: string) => { setBusinessType(type); search(query, type); };

  const header = (
    <>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search(query, businessType)}
          placeholder="Chèche biznis lokal..."
          returnKeyType="search"
          testID="browse-businesses-search-input"
        />
      </View>

      <LinearGradient colors={[colors.brandPrimary, "#4338CA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoBanner}>
        <Text style={styles.promoTitle}>Biznis Lokal</Text>
        <Text style={styles.promoSubtitle}>Otèl, Restoran, Garaj, Famasi — jwenn sèvis toupre w.</Text>
      </LinearGradient>

      <View style={styles.chipRow}>
        {BUSINESS_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.chip, businessType === t.value && styles.chipActive]}
            onPress={() => selectType(t.value)}
            testID={`browse-businesses-type-${t.value || "all"}`}
          >
            <Ionicons name={t.icon} size={14} color={businessType === t.value ? colors.onBrandPrimary : colors.brandPrimary} />
            <Text style={[styles.chipText, businessType === t.value && styles.chipTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {businessType || "Tout Biznis"}
        {!loading ? ` (${items.length})` : ""}
      </Text>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-businesses-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Biznis Lokal</Text>
        <Pressable onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/become-business`)} testID="browse-businesses-register">
          <Ionicons name="add-circle-outline" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={header}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyBox}>
                <Ionicons name="warning-outline" size={40} color="#DC2626" />
                <Text style={[styles.emptyText, { color: "#DC2626" }]}>{error}</Text>
                <Pressable style={styles.notifyMeBtn} onPress={() => search(query, businessType)} testID="browse-businesses-retry">
                  <Ionicons name="refresh" size={16} color={colors.brandPrimary} />
                  <Text style={styles.notifyMeBtnText}>Eseye Ankò</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="storefront-outline" size={40} color={colors.onSurfaceTertiary} />
                <Text style={styles.emptyText}>Pa gen biznis ki matche rechèch ou a.</Text>
                <Pressable
                  style={styles.notifyMeBtn}
                  onPress={() => {
                    notifyMeApi.subscribe({ kind: "business", city: user?.city || undefined }).catch(() => {});
                    Alert.alert("Nap Avize W", "N ap avize w lè yon nouvo biznis vin disponib.");
                  }}
                  testID="browse-businesses-notify-me"
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
              onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/business/${item.id}`)}
              testID={`browse-business-${item.id}`}
            >
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}><Ionicons name="storefront" size={20} color={colors.onSurfaceTertiary} /></View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={1}>{item.business_name}</Text>
                <Text style={styles.type}>{item.business_type}</Text>
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
  sectionTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.sm },
  emptyBox: { alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { fontSize: fontSize.base, color: colors.onSurfaceSecondary, textAlign: "center" },
  notifyMeBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderWidth: 1, borderColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  notifyMeBtnText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  card: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  avatar: { width: 48, height: 48, borderRadius: radius.md },
  avatarPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, justifyContent: "center" },
  name: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  type: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  location: { fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 },
});

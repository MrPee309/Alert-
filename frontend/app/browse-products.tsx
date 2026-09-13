import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Image, ScrollView } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { productsApi, type DealLakayProduct } from "@/src/api/products";
import { dealAlertsApi, type DealAlert } from "@/src/api/deal-alerts";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const CATEGORIES = [
  { value: "", label: "Tout", icon: "apps" as const },
  { value: "phone", label: "Telefòn", icon: "phone-portrait" as const },
  { value: "laptop", label: "Laptop", icon: "laptop" as const },
  { value: "parts", label: "Pyès", icon: "hardware-chip" as const },
  { value: "accessories", label: "Aksèswa", icon: "headset" as const },
];

function demandLabel(a: DealAlert): string {
  if (a.keyword) return a.keyword;
  const parts = [a.category, a.city].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Demand";
}

export default function BrowseProductsScreen() {
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "");
  const [popular, setPopular] = useState<DealLakayProduct[]>([]);
  const [demands, setDemands] = useState<DealAlert[]>([]);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const [productRes, demandRes] = await Promise.all([
        productsApi.list({ category: cat || undefined, sort: "most_popular" }).catch(() => ({ products: [] as DealLakayProduct[] })),
        dealAlertsApi.discover({ category: cat || undefined, alertType: "DEMAND" }).catch(() => [] as DealAlert[]),
      ]);
      setPopular(productRes.products.slice(0, 4));
      setDemands(demandRes.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(category); }, [category]));

  const runSearch = () => {
    if (!query.trim()) return;
    router.push({ pathname: "/search-results", params: { q: query.trim() } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-products-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Pwodwi</Text>
        <Pressable onPress={() => router.push({ pathname: "/create-alert", params: { category: category || "phone" } })} testID="browse-products-demand">
          <Ionicons name="megaphone-outline" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      {loading && popular.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
              placeholder="Chèche pwodwi..."
              returnKeyType="search"
              testID="browse-products-search-input"
            />
          </View>

          <LinearGradient colors={[colors.brandPrimary, "#4338CA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promoBanner}>
            <Text style={styles.promoTitle}>Tout pwodwi</Text>
            <Text style={styles.promoSubtitle}>Achte, vann, epi fè demand pou pwodwi ou bezwen.</Text>
          </LinearGradient>

          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[styles.chip, category === c.value && styles.chipActive]}
                onPress={() => setCategory(c.value)}
                testID={`browse-products-cat-${c.value || "all"}`}
              >
                <Ionicons name={c.icon} size={16} color={category === c.value ? colors.onBrandPrimary : colors.brandPrimary} />
                <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Pwodwi popilè</Text>
            <Pressable onPress={() => router.push({ pathname: "/browse-products-list", params: { category } })} testID="browse-products-popular-see-all">
              <Text style={styles.sectionLink}>Gade tout</Text>
            </Pressable>
          </View>

          {popular.length === 0 ? (
            <Text style={styles.emptyInline}>Pa gen pwodwi pou kategori sa a toujou.</Text>
          ) : (
            <View style={styles.popularGrid}>
              {popular.map((p) => (
                <Pressable key={p.id} style={styles.popularCard} onPress={() => router.push({ pathname: "/product-details", params: { slug: p.slug } })} testID={`browse-product-${p.id}`}>
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={styles.popularImage} />
                  ) : (
                    <View style={[styles.popularImage, styles.popularImagePlaceholder]}><Ionicons name="image-outline" size={22} color={colors.onSurfaceTertiary} /></View>
                  )}
                  <Pressable
                    style={styles.favoriteBtn}
                    onPress={() => { productsApi.toggleFavorite(p.id).catch(() => {}); setFavorited((f) => ({ ...f, [p.id]: !f[p.id] })); }}
                    testID={`browse-product-favorite-${p.id}`}
                  >
                    <Ionicons name={favorited[p.id] ? "heart" : "heart-outline"} size={16} color={favorited[p.id] ? "#EF4444" : colors.onSurfaceSecondary} />
                  </Pressable>
                  <Text style={styles.popularTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.popularPrice}>{p.price.toLocaleString()} Gdes</Text>
                  {p.favorites_count != null && p.favorites_count > 0 && (
                    <Text style={styles.popularMeta}>⭐ {p.favorites_count}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={styles.bigBtn}
            onPress={() => router.push({ pathname: "/browse-products-list", params: { category } })}
            testID="browse-products-see-all"
          >
            <Text style={styles.bigBtnText}>Gade tout pwodwi</Text>
          </Pressable>

          {demands.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Demand ki ka enterese w</Text>
                <Pressable onPress={() => router.push("/discover-alerts")} testID="browse-products-demands-see-all">
                  <Text style={styles.sectionLink}>Gade tout</Text>
                </Pressable>
              </View>
              {demands.map((d) => (
                <Pressable key={d.id} style={styles.demandCard} onPress={() => router.push({ pathname: "/alert-details", params: { id: d.id } })} testID={`browse-products-demand-${d.id}`}>
                  <View style={styles.demandIconWrap}><Ionicons name="search" size={16} color={colors.brandPrimary} /></View>
                  <View style={styles.demandBody}>
                    <Text style={styles.demandTitle} numberOfLines={1}>{demandLabel(d)}</Text>
                    <Text style={styles.demandMeta}>{[d.department, d.city].filter(Boolean).join(", ") || "Tout Ayiti"}</Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  promoBanner: { borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md },
  promoTitle: { fontSize: fontSize.xl, fontFamily: font.medium, color: "#fff" },
  promoSubtitle: { fontSize: fontSize.sm, color: "rgba(255,255,255,0.85)", marginTop: spacing.xs },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: fontSize.sm, color: colors.onSurface },
  chipTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  sectionLink: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },
  emptyInline: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  popularGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  popularCard: { width: "47%", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, ...shadow.card },
  popularImage: { width: "100%", height: 100, borderRadius: radius.md, marginBottom: spacing.xs },
  popularImagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  favoriteBtn: { position: "absolute", top: spacing.xs + 4, right: spacing.xs + 4, width: 28, height: 28, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  popularTitle: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  popularPrice: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium, marginTop: 2 },
  popularMeta: { fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 },
  bigBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.lg },
  bigBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  demandCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  demandIconWrap: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  demandBody: { flex: 1 },
  demandTitle: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  demandMeta: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
});

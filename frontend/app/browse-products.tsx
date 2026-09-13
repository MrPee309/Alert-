import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image } from "react-native";
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

/**
 * FIXED: this used to show only a 4-item "popilè" preview, requiring an
 * extra tap ("Gade tout pwodwi") to see everything — the reported bug.
 * Now the FULL, filterable product list IS this screen: opening "Pwodwi"
 * shows every active product immediately (category="" / "Tout" by
 * default), and tapping a category chip re-filters that same list in
 * place — no separate preview/full-list split anymore.
 */
export default function BrowseProductsScreen() {
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "");
  const [products, setProducts] = useState<DealLakayProduct[]>([]);
  const [demands, setDemands] = useState<DealAlert[]>([]);
  const [favorited, setFavorited] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const [productRes, demandRes] = await Promise.all([
        productsApi.list({ q: q || undefined, category: cat || undefined }).catch(() => ({ products: [] as DealLakayProduct[] })),
        dealAlertsApi.discover({ category: cat || undefined, alertType: "DEMAND" }).catch(() => [] as DealAlert[]),
      ]);
      setProducts(productRes.products);
      setDemands(demandRes.slice(0, 3));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(query, category); }, [category]));

  const selectCategory = (cat: string) => {
    setCategory(cat);
    load(query, cat);
  };

  const header = (
    <>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(query, category)}
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
            onPress={() => selectCategory(c.value)}
            testID={`browse-products-cat-${c.value || "all"}`}
          >
            <Ionicons name={c.icon} size={16} color={category === c.value ? colors.onBrandPrimary : colors.brandPrimary} />
            <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {category ? CATEGORIES.find((c) => c.value === category)?.label : "Tout Pwodwi"}
        {!loading ? ` (${products.length})` : ""}
      </Text>
    </>
  );

  const footer = demands.length > 0 ? (
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
            <Text style={styles.demandMeta}>
              {[d.department, d.city].filter(Boolean).join(", ") || "Tout Ayiti"}
              {d.response_count != null && d.response_count > 0 ? ` · ${d.response_count} repons` : ""}
            </Text>
          </View>
        </Pressable>
      ))}
    </>
  ) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-products-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Pwodwi</Text>
        <Pressable onPress={() => router.push({ pathname: "/create-alert", params: { category: category || "phone" } })} testID="browse-products-demand">
          <Ionicons name="megaphone-outline" size={22} color={colors.brandPrimary} />
        </Pressable>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ gap: spacing.sm }}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          ListEmptyComponent={<Text style={styles.emptyInline}>Pa gen pwodwi pou kategori sa a toujou.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: "/product-details", params: { slug: item.slug } })} testID={`browse-product-${item.id}`}>
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}><Ionicons name="image-outline" size={22} color={colors.onSurfaceTertiary} /></View>
              )}
              <Pressable
                style={styles.favoriteBtn}
                onPress={() => { productsApi.toggleFavorite(item.id).catch(() => {}); setFavorited((f) => ({ ...f, [item.id]: !f[item.id] })); }}
                testID={`browse-product-favorite-${item.id}`}
              >
                <Ionicons name={favorited[item.id] ? "heart" : "heart-outline"} size={16} color={favorited[item.id] ? "#EF4444" : colors.onSurfaceSecondary} />
              </Pressable>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPrice}>{item.price.toLocaleString()} Gdes</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>{item.city}</Text>
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: fontSize.sm, color: colors.onSurface },
  chipTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  sectionTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.sm },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionLink: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },
  emptyInline: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xl },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, ...shadow.card },
  cardImage: { width: "100%", height: 110, borderRadius: radius.md, marginBottom: spacing.xs },
  cardImagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  favoriteBtn: { position: "absolute", top: spacing.xs + 4, right: spacing.xs + 4, width: 28, height: 28, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: fontSize.sm, color: colors.onSurface, fontFamily: font.medium },
  cardPrice: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium, marginTop: 2 },
  cardLocation: { fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 },
  demandCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  demandIconWrap: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  demandBody: { flex: 1 },
  demandTitle: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  demandMeta: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
});

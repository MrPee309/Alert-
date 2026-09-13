import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { productsApi, type DealLakayProduct } from "@/src/api/products";
import { techniciansApi, type DealLakayTechnician } from "@/src/api/technicians";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

/**
 * Universal search — Phase 2. Runs the SAME query against the existing
 * products and technicians endpoints in parallel and shows both result
 * sets clearly separated. This is genuine full-text matching against
 * real data, not a simulated "AI routes your query" experience: if
 * nothing matches one side, that section simply doesn't appear.
 */
export default function SearchResultsScreen() {
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(initialQ || "");
  const [products, setProducts] = useState<DealLakayProduct[]>([]);
  const [technicians, setTechnicians] = useState<DealLakayTechnician[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [productRes, technicianRes] = await Promise.all([
        productsApi.list({ q }).catch(() => ({ products: [] as DealLakayProduct[] })),
        techniciansApi.list({ q }).catch(() => ({ technicians: [] as DealLakayTechnician[] })),
      ]);
      setProducts(productRes.products);
      setTechnicians(technicianRes.technicians);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { if (initialQ) runSearch(initialQ); }, []);

  const noResults = searched && !loading && products.length === 0 && technicians.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="search-results-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => runSearch(query)}
            placeholder="Chèche pwodwi, teknisyen..."
            returnKeyType="search"
            autoFocus={!initialQ}
            testID="search-results-input"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : noResults ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={40} color={colors.onSurfaceTertiary} />
          <Text style={styles.emptyText}>Pa gen rezilta pou "{query}".</Text>
          <Text style={styles.emptySubtext}>Eseye yon lòt mo, oswa fè yon Demand pou moun ka reponn ou.</Text>
          <Pressable style={styles.demandBtn} onPress={() => router.push("/create-alert")} testID="search-results-make-demand">
            <Text style={styles.demandBtnText}>Fè yon Demand</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={[
            ...(products.length ? [{ type: "products-header" as const, id: "ph" }, ...products.map((p) => ({ type: "product" as const, id: p.id, data: p }))] : []),
            ...(technicians.length ? [{ type: "technicians-header" as const, id: "th" }, ...technicians.map((t) => ({ type: "technician" as const, id: t.username, data: t }))] : []),
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (item.type === "products-header") return <Text style={styles.sectionLabel}>🛍️ Pwodwi ({products.length})</Text>;
            if (item.type === "technicians-header") return <Text style={styles.sectionLabel}>🔧 Teknisyen ({technicians.length})</Text>;
            if (item.type === "product") {
              const p = item.data;
              return (
                <Pressable style={styles.resultCard} onPress={() => router.push({ pathname: "/product-details", params: { slug: p.slug } })} testID={`search-product-${p.id}`}>
                  {p.images?.[0] ? <Image source={{ uri: p.images[0] }} style={styles.resultImage} /> : <View style={[styles.resultImage, styles.resultImagePlaceholder]}><Ionicons name="image-outline" size={20} color={colors.onSurfaceTertiary} /></View>}
                  <View style={styles.resultBody}>
                    <Text style={styles.resultTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.resultSub}>{p.price.toLocaleString()} HTG · {p.city}</Text>
                  </View>
                </Pressable>
              );
            }
            const t = item.data;
            return (
              <Pressable style={styles.resultCard} onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/technician/${t.username}`)} testID={`search-technician-${t.username}`}>
                {t.avatar ? <Image source={{ uri: t.avatar }} style={styles.resultAvatar} /> : <View style={[styles.resultAvatar, styles.resultImagePlaceholder]}><Ionicons name="person" size={18} color={colors.onSurfaceTertiary} /></View>}
                <View style={styles.resultBody}>
                  <Text style={styles.resultTitle} numberOfLines={1}>{t.full_name}</Text>
                  <Text style={styles.resultSub} numberOfLines={1}>{t.specialties.join(", ")} · {t.city}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  searchRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl },
  emptyText: { fontSize: fontSize.base, color: colors.onSurface, textAlign: "center" },
  emptySubtext: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },
  demandBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md },
  demandBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  listContent: { padding: spacing.lg },
  sectionLabel: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.sm },
  resultCard: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm, alignItems: "center", ...shadow.card },
  resultImage: { width: 50, height: 50, borderRadius: radius.md },
  resultAvatar: { width: 44, height: 44, borderRadius: radius.pill },
  resultImagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  resultBody: { flex: 1 },
  resultTitle: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  resultSub: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
});

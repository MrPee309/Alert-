import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, FlatList, Image } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { productsApi, type DealLakayProduct } from "@/src/api/products";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const CATEGORIES = [
  { value: "", label: "Tout" },
  { value: "phone", label: "Telefòn" },
  { value: "laptop", label: "Laptop" },
  { value: "parts", label: "Pyès" },
  { value: "accessories", label: "Aksèswa" },
];

export default function BrowseProductsScreen() {
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory || "");
  const [items, setItems] = useState<DealLakayProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const search = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const res = await productsApi.list({ q: q || undefined, category: cat || undefined });
      setItems(res.products);
    } catch { /* keep last results on transient failure */ } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { search(query, category); }, []));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="browse-products-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Chèche Pwodwi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search(query, category)}
          placeholder="Telefòn, laptop, pyès..."
          returnKeyType="search"
          testID="browse-products-search-input"
        />
      </View>

      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.value}
            style={[styles.chip, category === c.value && styles.chipActive]}
            onPress={() => { setCategory(c.value); search(query, c.value); }}
            testID={`browse-products-cat-${c.value || "all"}`}
          >
            <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={40} color={colors.onSurfaceTertiary} />
          <Text style={styles.emptyText}>Pa gen rezilta pou rechèch sa a.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push({ pathname: "/product-details", params: { slug: item.slug } })} testID={`browse-product-${item.id}`}>
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}><Ionicons name="image-outline" size={24} color={colors.onSurfaceTertiary} /></View>
              )}
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPrice}>{item.price.toLocaleString()} HTG</Text>
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
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, margin: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: fontSize.sm, color: colors.onSurface },
  chipTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  emptyText: { fontSize: fontSize.base, color: colors.onSurfaceSecondary },
  listContent: { padding: spacing.lg, gap: spacing.sm },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, ...shadow.card },
  cardImage: { width: "100%", height: 110, borderRadius: radius.md, marginBottom: spacing.xs },
  cardImagePlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: fontSize.sm, color: colors.onSurface, fontFamily: font.medium },
  cardPrice: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium, marginTop: 2 },
  cardLocation: { fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 },
});

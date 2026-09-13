import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Image, Linking } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { productsApi, type DealLakayProduct } from "@/src/api/products";
import { techniciansApi, type DealLakayTechnician } from "@/src/api/technicians";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

type FavItem =
  | { kind: "products-header" }
  | { kind: "technicians-header" }
  | { kind: "product"; data: DealLakayProduct }
  | { kind: "technician"; data: DealLakayTechnician };

export default function FavoritesScreen() {
  const [products, setProducts] = useState<DealLakayProduct[]>([]);
  const [technicians, setTechnicians] = useState<DealLakayTechnician[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        productsApi.myFavorites().catch(() => []),
        techniciansApi.myFavorites().catch(() => []),
      ]).then(([p, t]) => { setProducts(p); setTechnicians(t); }).finally(() => setLoading(false));
    }, []),
  );

  const data: FavItem[] = [
    ...(products.length ? [{ kind: "products-header" } as FavItem, ...products.map((p) => ({ kind: "product", data: p } as FavItem))] : []),
    ...(technicians.length ? [{ kind: "technicians-header" } as FavItem, ...technicians.map((t) => ({ kind: "technician", data: t } as FavItem))] : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="favorites-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Sa Mwen Sove</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} size="large" /></View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={40} color={colors.onSurfaceTertiary} />
          <Text style={styles.emptyText}>Ou poko sove anyen.</Text>
          <Text style={styles.emptySubtext}>Tape ❤️ sou yon pwodwi oswa teknisyen pou sove l isit la.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => ("data" in item ? (item.kind === "product" ? item.data.id : item.data.username) : `h-${i}`)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (item.kind === "products-header") return <Text style={styles.sectionLabel}>🛍️ Pwodwi</Text>;
            if (item.kind === "technicians-header") return <Text style={styles.sectionLabel}>🔧 Teknisyen</Text>;
            if (item.kind === "product") {
              const p = item.data;
              return (
                <Pressable style={styles.card} onPress={() => router.push({ pathname: "/product-details", params: { slug: p.slug } })} testID={`favorite-product-${p.id}`}>
                  {p.images?.[0] ? <Image source={{ uri: p.images[0] }} style={styles.thumb} /> : <View style={[styles.thumb, styles.thumbPlaceholder]}><Ionicons name="image-outline" size={20} color={colors.onSurfaceTertiary} /></View>}
                  <View style={styles.cardBody}><Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text><Text style={styles.cardSub}>{p.price.toLocaleString()} HTG</Text></View>
                </Pressable>
              );
            }
            const t = item.data;
            return (
              <Pressable style={styles.card} onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/technician/${t.username}`)} testID={`favorite-technician-${t.username}`}>
                {t.avatar ? <Image source={{ uri: t.avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.thumbPlaceholder]}><Ionicons name="person" size={18} color={colors.onSurfaceTertiary} /></View>}
                <View style={styles.cardBody}><Text style={styles.cardTitle} numberOfLines={1}>{t.full_name}</Text><Text style={styles.cardSub} numberOfLines={1}>{t.specialties.join(", ")}</Text></View>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl },
  emptyText: { fontSize: fontSize.base, color: colors.onSurface },
  emptySubtext: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },
  listContent: { padding: spacing.lg },
  sectionLabel: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.sm },
  card: { flexDirection: "row", gap: spacing.sm, alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.sm, ...shadow.card },
  thumb: { width: 50, height: 50, borderRadius: radius.md },
  avatar: { width: 44, height: 44, borderRadius: radius.pill },
  thumbPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  cardSub: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
});

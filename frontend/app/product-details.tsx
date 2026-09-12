import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { productsApi, type ProductDetailResponse } from "@/src/api/products";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function ProductDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [data, setData] = useState<ProductDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    productsApi.get(slug).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <Text style={styles.title}>Pwodwi sa a pa jwenn.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}><Text style={styles.primaryBtnText}>Retounen</Text></Pressable>
      </SafeAreaView>
    );
  }

  const { product, seller } = data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="product-details-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}><Ionicons name="image-outline" size={40} color={colors.onSurfaceTertiary} /></View>
        )}

        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{product.price.toLocaleString()} HTG</Text>
        <Text style={styles.location}>📍 {product.city}, {product.department}</Text>
        <Text style={styles.description}>{product.description}</Text>

        {seller && (
          <View style={styles.sellerCard}>
            <Text style={styles.sellerLabel}>Vandè</Text>
            <Text style={styles.sellerName}>{seller.store_name || seller.full_name}</Text>
            {seller.seller_verified && <Text style={styles.verified}>✓ Verifye</Text>}
          </View>
        )}

        {/* Full purchase/contact/messaging flow lives on the website for
            now — this native screen covers discovery (search → view
            details); contacting the seller bridges out honestly rather
            than faking an in-app checkout that doesn't exist yet here. */}
        <Pressable
          style={styles.contactBtn}
          onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/product/${product.slug}`)}
          testID="product-details-contact"
        >
          <Text style={styles.contactBtnText}>Kontakte Vandè sou Sit la</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  center: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { flex: 1, textAlign: "center", fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginHorizontal: spacing.sm },
  scrollContent: { padding: spacing.lg },
  image: { width: "100%", height: 240, borderRadius: radius.lg, marginBottom: spacing.md },
  imagePlaceholder: { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },
  price: { fontSize: fontSize.lg, color: colors.brandPrimary, fontFamily: font.medium, marginTop: spacing.xs },
  location: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.xs },
  description: { fontSize: fontSize.base, color: colors.onSurface, marginTop: spacing.md, lineHeight: 22 },
  sellerCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg, ...shadow.card },
  sellerLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  sellerName: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: 2 },
  verified: { fontSize: fontSize.sm, color: colors.success, marginTop: 2 },
  contactBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.xl },
  contactBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  primaryBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, marginTop: spacing.md },
  primaryBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
});

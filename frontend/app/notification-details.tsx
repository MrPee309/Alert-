import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { alertsApi } from "@/src/api/alerts";
import { productsApi, type DealLakayProduct, type DealLakaySeller } from "@/src/api/products";
import type { AppNotification } from "@/src/types";
import { WEBSITE_URL } from "@/src/constants/config";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

// The 13 notification types the real DealLakay backend actually emits
// (grep'd from every create_notification() call site) — nothing invented.
const TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string; heroColor: string }> = {
  deal_alert: { icon: "flame", label: "Match Jwenn", heroColor: colors.brandPrimary },
  favorite: { icon: "heart", label: "Favori", heroColor: colors.brandPrimary },
  new_request: { icon: "search", label: "Nouvo Demann", heroColor: colors.brandPrimary },
  offer: { icon: "pricetag", label: "Nouvo Òf", heroColor: colors.brandPrimary },
  offer_proposed: { icon: "pricetag", label: "Òf Pwopoze", heroColor: colors.brandPrimary },
  offer_confirmed: { icon: "checkmark-circle", label: "Òf Konfime", heroColor: colors.success },
  offer_declined: { icon: "close-circle", label: "Òf Refize", heroColor: colors.error },
  supplier_inquiry: { icon: "globe", label: "Demann Founisè", heroColor: colors.brandPrimary },
  message: { icon: "chatbubble", label: "Nouvo Mesaj", heroColor: colors.brandPrimary },
  listing: { icon: "storefront", label: "Anons", heroColor: colors.brandPrimary },
  verified: { icon: "shield-checkmark", label: "Verifikasyon", heroColor: colors.success },
  supplier_approved: { icon: "checkmark-circle", label: "Founisè Apwouve", heroColor: colors.success },
  supplier_rejected: { icon: "close-circle", label: "Founisè Rejte", heroColor: colors.error },
};
const DEFAULT_META = { icon: "notifications" as const, label: "DealLakay", heroColor: colors.brandPrimary };

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "kounye a";
  if (mins < 60) return `${mins}min pase`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}è pase`;
  return `${Math.floor(hrs / 24)}j pase`;
}

type LoadState = "loading" | "ready" | "not-found" | "error";

export default function NotificationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [product, setProduct] = useState<DealLakayProduct | null>(null);
  const [seller, setSeller] = useState<DealLakaySeller | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const list = await alertsApi.getNotifications();
      const found = list.find((n) => n.id === id);
      if (!found) {
        setState("not-found");
        return;
      }
      setNotification(found);

      // Enrich with real product data when the link points to one —
      // DealLakay's notification objects don't embed product details
      // themselves, only this message + link.
      if (found.link?.startsWith("/product/")) {
        const slug = found.link.replace("/product/", "");
        try {
          const detail = await productsApi.get(slug);
          setProduct(detail.product);
          setSeller(detail.seller);
        } catch {
          // Product may have been removed/sold since the notification fired
          // — the notification itself is still valid, just show it plainly.
        }
      }

      if (!found.read) {
        alertsApi.markRead(found.id).catch(() => undefined);
      }

      setState("ready");
    } catch {
      setState("error");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openLink = async () => {
    if (!WEBSITE_URL || !notification?.link) return;
    await WebBrowser.openBrowserAsync(`${WEBSITE_URL}${notification.link}`);
  };

  const meta = notification ? TYPE_META[notification.type] || DEFAULT_META : DEFAULT_META;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()} testID="notification-details-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.topBarTitle}>Detay Notifikasyon</Text>
        <View style={styles.iconButton} />
      </View>

      {state === "loading" && <SkeletonBody />}

      {state === "error" && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.onSurfaceTertiary} />
          <Text style={styles.centerStateText}>Nou pa kapab chaje notifikasyon sa a.</Text>
          <Pressable style={styles.retryButton} onPress={load} testID="notification-details-retry">
            <Text style={styles.retryButtonText}>Eseye ankò</Text>
          </Pressable>
        </View>
      )}

      {state === "not-found" && (
        <View style={styles.centerState}>
          <Ionicons name="help-circle-outline" size={28} color={colors.onSurfaceTertiary} />
          <Text style={styles.centerStateText}>Notifikasyon sa a pa disponib ankò.</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()} testID="notification-details-back-notfound">
            <Text style={styles.retryButtonText}>Retounen</Text>
          </Pressable>
        </View>
      )}

      {state === "ready" && notification && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.hero, { backgroundColor: meta.heroColor }]}>
            <View style={styles.heroIconWrap}>
              <Ionicons name={meta.icon} size={30} color={colors.onBrandPrimary} />
            </View>
            <Text style={styles.heroLabel}>{meta.label}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.message}>{notification.message}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{timeAgo(notification.createdAt)}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{notification.read ? "Li" : "Pa li"}</Text>
            </View>
          </View>

          {!!product && (
            <View style={styles.productCard}>
              {!!product.images?.[0] && (
                <Image source={{ uri: product.images[0] }} style={styles.productImage} resizeMode="cover" />
              )}
              <View style={styles.productBody}>
                <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                <Text style={styles.productPrice}>${product.price}</Text>
                <Text style={styles.productMeta}>
                  {product.quantity > 0 ? `${product.quantity} disponib` : "Pa disponib"} · {product.city}, {product.department}
                </Text>
                {!!seller && (
                  <Text style={styles.productSeller}>
                    {seller.store_name || seller.full_name}
                    {seller.seller_verified ? " ✓" : ""}
                  </Text>
                )}
              </View>
            </View>
          )}

          {!!notification.link && !!WEBSITE_URL && (
            <Pressable style={styles.ctaButton} onPress={openLink} testID="notification-details-cta">
              <Text style={styles.ctaButtonText}>{product ? "Wè Pwodwi" : "Wè sou DealLakay"}</Text>
              <Ionicons name="open-outline" size={16} color={colors.onBrandPrimary} />
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SkeletonBody() {
  return (
    <View style={styles.scrollContent}>
      <View style={[styles.hero, styles.skeletonBlock]} />
      <View style={[styles.card, styles.skeletonBlock, { height: 90 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  iconButton: { width: 36, height: 36, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, ...shadow.card },
  topBarTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },

  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, paddingHorizontal: spacing.xl },
  centerStateText: { color: colors.onSurfaceSecondary, fontSize: fontSize.base, textAlign: "center" },
  retryButton: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryButtonText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },

  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  hero: { borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", ...shadow.raised },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroLabel: { color: colors.onBrandPrimary, fontSize: fontSize.lg, fontFamily: font.medium },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.md, ...shadow.card },
  message: { fontSize: fontSize.base, color: colors.onSurface, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.md },
  metaText: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary },
  metaDot: { width: 3, height: 3, borderRadius: radius.pill, backgroundColor: colors.onSurfaceTertiary },

  productCard: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.lg, marginTop: spacing.md, overflow: "hidden", ...shadow.card },
  productImage: { width: 96, height: 96, backgroundColor: colors.surfaceSecondary },
  productBody: { flex: 1, padding: spacing.md, justifyContent: "center" },
  productTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  productPrice: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.brandPrimary, marginTop: 2 },
  productMeta: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  productSeller: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: 2 },

  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  ctaButtonText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },

  skeletonBlock: { backgroundColor: colors.surfaceTertiary, opacity: 0.6 },
});

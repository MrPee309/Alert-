import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Image,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { useUserRole } from "@/src/hooks/use-user-role";
import { dealAlertsApi, type DealAlert } from "@/src/api/deal-alerts";
import { alertsApi } from "@/src/api/alerts";
import { techniciansApi, type DealLakayTechnician } from "@/src/api/technicians";
import { WEBSITE_URL } from "@/src/constants/config";
import type { AppNotification } from "@/src/types";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";
import { BottomNav } from "@/src/components/BottomNav";
import { NotificationBell } from "@/src/components/NotificationBell";
import { WaveHeader } from "@/src/components/WaveHeader";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "kounye a";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}è`;
  return `${Math.floor(hrs / 24)}j`;
}

function alertLabel(a: DealAlert): string {
  if (a.keyword) return a.keyword;
  const parts = [a.category, a.city].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Alèt";
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { role, roleLabel, roleColors } = useUserRole();
  const [dealAlerts, setDealAlerts] = useState<DealAlert[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [availableDemands, setAvailableDemands] = useState<DealAlert[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
    const [nearbyTechnicians, setNearbyTechnicians] = useState<DealLakayTechnician[]>([]);

  const isClient = role === "CLIENT";
  const isSupplier = role === "SUPPLIER";
  const isPro = role === "TECHNICIAN" || role === "SELLER" || role === "TECHNICIAN_SELLER";

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [alerts, notifs] = await Promise.all([dealAlertsApi.list(), alertsApi.getNotifications()]);
      setDealAlerts(alerts);
      setNotifications(notifs);

      // Whether the user already has ANY driver profile (pending or
      // verified) — decides if the Transpò card says "Vin Chofè Moto" or
      // "Dashboard Chofè Mwen". A 404 here just means no profile yet.
      // (driver-profile lookup moved to Profile.tsx, where the "Vin
      // Chofè"/"Dashboard Chofè" link now lives)

      if (isClient) {
        techniciansApi.list({ sort: "recommended" }).then((res) => setNearbyTechnicians(res.technicians.slice(0, 3))).catch(() => setNearbyTechnicians([]));
      }

      if (isClient) {
        // A Client's "Repons Resevwa" count is the sum of responses across
        // every Demand they've posted — there's no single aggregate
        // endpoint for this, so we fetch per-alert and add them up.
        const myDemands = alerts.filter((a) => a.alert_type === "DEMAND");
        const results = await Promise.all(
          myDemands.map((a) => dealAlertsApi.getResponses(a.id).catch(() => [])),
        );
        setResponseCount(results.reduce((sum, r) => sum + r.length, 0));
      }

      if (isSupplier) {
        // Verified suppliers see the full Demand pool — used here just to
        // surface a live count on their Dashboard.
        const discovered = await dealAlertsApi.discover({ alertType: "DEMAND" }).catch(() => []);
        setAvailableDemands(discovered);
      }
    } catch {
      /* dashboard degrades gracefully — sections just show empty states */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isClient, isSupplier]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const activeAlerts = dealAlerts.filter((a) => a.active);
  const myDemands = activeAlerts.filter((a) => a.alert_type === "DEMAND");
  const myOffers = activeAlerts.filter((a) => a.alert_type === "OFFER");
  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentActivity = notifications.slice(0, 4);

  // The list this role's "primary" section shows — Clients only ever have
  // Demands, Suppliers only ever have Offers, everyone else sees both mixed.
  const primaryList = useMemo(() => {
    if (isClient) return myDemands;
    if (isSupplier) return myOffers;
    return activeAlerts;
  }, [isClient, isSupplier, myDemands, myOffers, activeAlerts]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Gradient header banner — approximates the reference mockup's
          blue "wave" header using a rounded-bottom LinearGradient rather
          than an SVG wave path (react-native-svg isn't installed in this
          project; adding it would need a new native dependency + rebuild).
          Sits OUTSIDE the padded ScrollView so it can bleed edge-to-edge;
          the search bar below overlaps its bottom edge via negative margin. */}
      <WaveHeader height={210}>
        <Image
          pointerEvents="none"
          source={require("@/assets/images/palm-trees-header.png")}
          style={styles.headerPalmTrees}
          resizeMode="contain"
        />

        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <View style={styles.wordmarkRow}>
              <Image source={require("@/assets/images/deallakay-icon.png")} style={styles.logoIcon} />
              <View>
                <Text style={styles.wordmarkOnDark}>Deal<Text style={styles.wordmarkAccentOnDark}>Lakay</Text></Text>
                <Text style={styles.wordmarkOnDark}>Alèt</Text>
              </View>
            </View>
            <NotificationBell color={colors.onBrandPrimary} />
          </View>
          <Text style={styles.headerTagline}>Enfòmasyon ki itil, opòtinite ki pi pre w!</Text>
        </SafeAreaView>
      </WaveHeader>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brandPrimary} />}
      >
        {/* Universal search — Phase 2: searches products AND technicians
            together in one place, rather than the earlier version which
            only opened product browsing. Sits with a negative top margin
            so it visually overlaps the gradient banner's bottom edge. */}
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push("/search-results")}
          testID="dashboard-search-bar"
        >
          <Ionicons name="search" size={18} color={colors.onSurfaceTertiary} />
          <Text style={styles.searchBarText}>Chèche pwodwi, sèvis, teknisyen...</Text>
        </Pressable>

        {/* Home matches the approved reference exactly: greeting → 2 quick
            actions (Chèche / Fè yon Demand) → "Tout Sèvis" (5 simple cards,
            each a single tap to that section) → "Toupre ou" nearby feed.
            No per-section duplicate browse+demand buttons — Fè yon Demand
            lives ONCE, at the top, and each category screen has its own
            demand entry point in its own header (not on Home). */}
        {isClient ? (
          <>
            <Text style={styles.greeting}>Bonjou, {user?.fullName?.split(" ")[0] || "zanmi"} 👋</Text>
            <Text style={styles.hubQuestion}>Kisa ou vle fè jodi a?</Text>
            <View style={styles.quickActionRow}>
              <Pressable style={styles.quickActionCardWrap} onPress={() => router.push("/search-results")} testID="dashboard-quick-search">
                <LinearGradient colors={[colors.brandPrimary, "#4338CA"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickActionPrimary}>
                  <Ionicons name="search" size={20} color={colors.onBrandPrimary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickActionPrimaryText}>Chèche</Text>
                    <Text style={styles.quickActionPrimarySubtext}>Sèvis, pwodwi, plis...</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.quickActionSecondary} onPress={() => router.push("/make-a-demand")} testID="dashboard-quick-demand">
                <Ionicons name="megaphone-outline" size={20} color={colors.onSurface} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickActionSecondaryText}>Fè yon Demand</Text>
                  <Text style={styles.quickActionSecondarySubtext}>Poste bezwen w</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceTertiary} />
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Tout sèvis</Text>
            {/* FIXED: flexWrap+justifyContent on one container didn't
                reliably center the incomplete last row (2 items left-
                aligned instead of centered) — explicit 3-then-2 rows,
                each individually centered, fixes this for good. */}
            {(() => {
              const services = [
                { icon: "cart", label: "Pwodwi", subtitle: "Telefòn, òdinatè...", color: "#8B5CF6", onPress: () => router.push("/browse-products") },
                { icon: "construct", label: "Teknisyen", subtitle: "Reparasyon, sèvis...", color: "#2563EB", onPress: () => router.push("/browse-technicians") },
                { icon: "storefront", label: "Biznis Lokal", subtitle: "Boutik, magazen...", color: "#F97316", onPress: () => router.push("/browse-businesses") },
                { icon: "bicycle", label: "Transpò & Livrezon", subtitle: "Andan / Aletranje...", color: "#0891B2", onPress: () => router.push("/transport-category") },
                { icon: "earth", label: "Founisè", subtitle: "Etazini, ènténasyonal...", color: "#16A34A", onPress: () => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/suppliers`) },
              ];
              const rows: (typeof services)[] = [];
              for (let i = 0; i < services.length; i += 3) rows.push(services.slice(i, i + 3));
              return rows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.allServicesRow}>
                  {row.map((s, i) => (
                    <Pressable key={i} style={styles.allServicesCard} onPress={s.onPress} testID={`dashboard-allservices-${rowIndex * 3 + i}`}>
                      <View style={[styles.allServicesIcon, { backgroundColor: `${s.color}1A` }]}><Ionicons name={s.icon as any} size={20} color={s.color} /></View>
                      <Text style={styles.allServicesLabel} numberOfLines={2}>{s.label}</Text>
                      <Text style={styles.allServicesSubtitle} numberOfLines={1}>{s.subtitle}</Text>
                    </Pressable>
                  ))}
                </View>
              ));
            })()}

            {/* "Toupre ou" — a real recommended-technicians feed (no fake
                distance figure, since the app doesn't compute GPS distance
                to each technician here — only what's genuinely available:
                name, specialty, rating). */}
            <View style={styles.trustBanner} testID="dashboard-trust-banner">
              <View style={styles.trustBannerIcon}><Ionicons name="shield-checkmark" size={22} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trustBannerTitle}>Rezo serye, kominote solid</Text>
                <Text style={styles.trustBannerSubtitle}>Pataje, achte, vann, grandi ansanm</Text>
              </View>
            </View>

            {nearbyTechnicians.length > 0 && (
              <>
                <View style={styles.nearbyHeaderRow}>
                  <Text style={styles.sectionTitle}>Toupre ou</Text>
                  <Pressable onPress={() => router.push("/browse-technicians")} testID="dashboard-nearby-see-all">
                    <Text style={styles.nearbySeeAll}>Gade Tout</Text>
                  </Pressable>
                </View>
                {nearbyTechnicians.map((t) => (
                  <Pressable key={t.username} style={styles.nearbyCard} onPress={() => router.push("/browse-technicians")} testID={`dashboard-nearby-${t.username}`}>
                    {t.avatar ? (
                      <Image source={{ uri: t.avatar }} style={styles.nearbyAvatar} />
                    ) : (
                      <View style={[styles.nearbyAvatar, styles.nearbyAvatarPlaceholder]}><Ionicons name="person" size={18} color={colors.onSurfaceTertiary} /></View>
                    )}
                    <View style={styles.nearbyBody}>
                      <Text style={styles.nearbyName} numberOfLines={1}>{t.specialties[0] ? `Technicien ${t.specialties[0]}` : t.full_name}</Text>
                      <Text style={styles.nearbyMeta}>{t.review_count > 0 ? `⭐ ${t.rating.toFixed(1)} (${t.review_count})` : t.city || ""}</Text>
                    </View>
                    {t.technician_verified && <View style={styles.nearbyBadge}><Text style={styles.nearbyBadgeText}>Disponib</Text></View>}
                  </Pressable>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.greeting}>Bonjou, {user?.fullName?.split(" ")[0] || "zanmi"} {
              role === "TECHNICIAN" ? "👋🔧" :
              role === "SELLER" ? "👋🛍️" :
              role === "TECHNICIAN_SELLER" ? "👋🔧🛍️" :
              role === "SUPPLIER" ? "👋🌎" :
              "👋"
            }</Text>
            <Text style={styles.hubQuestion}>Kisa ou vle fè jodi a?</Text>
            <View style={styles.quickGrid}>
              {/* Build the action set from role FLAGS rather than one fixed
                array — a pure Technician should never see "Ajoute Pwodwi"
                (they don't sell products), and TECHNICIAN_SELLER correctly
                gets both sets rather than only one. */}
            {(isSupplier ? [
              { icon: "globe", label: "Sit Founisè Mwen", onPress: () => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/suppliers`) },
              { icon: "chatbubbles", label: "Messenger", onPress: () => router.push("/messenger") },
            ] : [
              ...(role === "SELLER" || role === "TECHNICIAN_SELLER" ? [
                { icon: "add-circle", label: "Ajoute Pwodwi", onPress: () => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/sell`) },
              ] : []),
              ...(role === "TECHNICIAN" || role === "TECHNICIAN_SELLER" ? [
                { icon: "construct", label: "Sèvis Mwen", onPress: () => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/technician-dashboard`) },
              ] : []),
              { icon: "chatbubbles", label: "Messenger", onPress: () => router.push("/messenger") },
            ]).map((a, i) => (
              <Pressable key={i} style={styles.quickGridItem} onPress={a.onPress} testID={`dashboard-quick-${i}`}>
                <View style={styles.quickGridIcon}><Ionicons name={a.icon as any} size={20} color={colors.brandPrimary} /></View>
                <Text style={styles.quickGridLabel}>{a.label}</Text>
              </Pressable>
            ))}
            </View>
          </>
        )}

        {/* Summary cards — content differs by role */}
        <View style={styles.summaryRow}>
          {isClient && (
            <>
              <LinearGradient colors={roleColors} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="search" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.summaryValueLight}>{myDemands.length}</Text>
                <Text style={styles.summaryLabelLight}>Demann Mwen</Text>
              </LinearGradient>
              <View style={styles.summaryCardLight}>
                <Ionicons name="chatbubbles" size={20} color={colors.brandPrimary} />
                <Text style={styles.summaryValue}>{responseCount}</Text>
                <Text style={styles.summaryLabel}>Repons Resevwa</Text>
              </View>
            </>
          )}
          {isPro && (
            <>
              <LinearGradient colors={roleColors} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="search" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.summaryValueLight}>{myDemands.length}</Text>
                <Text style={styles.summaryLabelLight}>Demann Mwen</Text>
              </LinearGradient>
              <View style={styles.summaryCardLight}>
                <Ionicons name="cube" size={20} color={colors.brandPrimary} />
                <Text style={styles.summaryValue}>{myOffers.length}</Text>
                <Text style={styles.summaryLabel}>Òf Mwen</Text>
              </View>
            </>
          )}
          {isSupplier && (
            <>
              <LinearGradient colors={roleColors} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="cube" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.summaryValueLight}>{myOffers.length}</Text>
                <Text style={styles.summaryLabelLight}>Òf Mwen</Text>
              </LinearGradient>
              <View style={styles.summaryCardLight}>
                <Ionicons name="search" size={20} color={colors.brandPrimary} />
                <Text style={styles.summaryValue}>{availableDemands.length}</Text>
                <Text style={styles.summaryLabel}>Demann Disponib</Text>
              </View>
            </>
          )}
        </View>

        {/* Quick actions — Pro/Supplier get shortcuts a Client shouldn't see */}
        {(isPro || isSupplier) && (
          <View style={styles.quickRow}>
            <Pressable style={styles.quickCard} onPress={() => router.push("/discover-alerts")} testID="dashboard-discover">
              <Ionicons name="globe-outline" size={20} color={colors.brandPrimary} />
              <Text style={styles.quickLabel}>Dekouvèt Kominote a</Text>
            </Pressable>
            <Pressable style={styles.quickCard} onPress={() => router.push("/hot-matches")} testID="dashboard-hot-matches">
              <Ionicons name="flame" size={20} color={colors.brandPrimary} />
              <Text style={styles.quickLabel}>Hot Matches</Text>
            </Pressable>
          </View>
        )}

        {/* Seller/Supplier bridge to website-managed features not yet
            native to the mobile app (product catalog, inquiries, shipping) */}
        {(role === "SELLER" || role === "TECHNICIAN_SELLER") && (
          <Pressable
            style={styles.websiteBridge}
            onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/seller-dashboard`)}
            testID="dashboard-manage-products"
          >
            <Ionicons name="storefront-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.websiteBridgeText}>Jere Pwodwi Ou sou Sit DealLakay la</Text>
            <Ionicons name="open-outline" size={16} color={colors.onSurfaceTertiary} />
          </Pressable>
        )}
        {(role === "TECHNICIAN" || role === "TECHNICIAN_SELLER") && (
          <Pressable
            style={styles.websiteBridge}
            onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/technician-dashboard`)}
            testID="dashboard-manage-services"
          >
            <Ionicons name="construct-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.websiteBridgeText}>Jere Sèvis Ou sou Sit DealLakay la</Text>
            <Ionicons name="open-outline" size={16} color={colors.onSurfaceTertiary} />
          </Pressable>
        )}
        {isSupplier && (
          <Pressable
            style={styles.websiteBridge}
            onPress={() => WEBSITE_URL && Linking.openURL(`${WEBSITE_URL}/suppliers`)}
            testID="dashboard-manage-supplier"
          >
            <Ionicons name="cube-outline" size={18} color={colors.brandPrimary} />
            <Text style={styles.websiteBridgeText}>Jere Pwodwi, Demann & Livrezon sou Sit la</Text>
            <Ionicons name="open-outline" size={16} color={colors.onSurfaceTertiary} />
          </Pressable>
        )}

        {/* Recent activity */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Aktivite Resan</Text>
          <Pressable onPress={() => router.push("/notifications")} testID="dashboard-see-all-activity">
            <Text style={styles.sectionLink}>Wè tout</Text>
          </Pressable>
        </View>

        {recentActivity.length === 0 ? (
          <EmptyState icon="pulse-outline" title="Pa gen aktivite ankò." subtitle="Ou ap wè aktivite ou isit la." />
        ) : (
          recentActivity.map((n) => (
            <Pressable
              key={n.id}
              style={styles.activityRow}
              onPress={() => router.push({ pathname: "/notification-details", params: { id: n.id } })}
              testID={`dashboard-activity-${n.id}`}
            >
              <View style={[styles.activityIconWrap, !n.read && styles.activityIconWrapUnread]}>
                <Ionicons name="notifications" size={16} color={n.read ? colors.onSurfaceTertiary : colors.brandPrimary} />
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityText} numberOfLines={2}>{n.message}</Text>
                <Text style={styles.activityTime}>{timeAgo(n.createdAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceTertiary} />
            </Pressable>
          ))
        )}
      </ScrollView>
      <BottomNav active="akey" />
    </SafeAreaView>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={22} color={colors.onSurfaceTertiary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {!!actionLabel && (
        <Pressable style={styles.emptyAction} onPress={onAction} testID="dashboard-empty-action">
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loadingContainer: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },

  headerBanner: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, position: "relative", overflow: "hidden" },
  glowTopRight: { position: "absolute", top: -60, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)" },
  headerPalmTrees: { position: "absolute", bottom: 0, right: 0, width: 170, height: 130 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerText: { flex: 1 },
  greeting: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },
  wordmarkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoIcon: { width: 44, height: 44, borderRadius: radius.md },
  wordmark: { fontSize: fontSize.xl, fontFamily: font.display, color: colors.onSurface },
  wordmarkAccent: { color: colors.brandPrimary },
  wordmarkOnDark: { fontSize: fontSize.lg, fontFamily: font.display, color: "#fff", lineHeight: fontSize.lg + 2 },
  wordmarkAccentOnDark: { color: "#93C5FD" },
  headerTagline: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, marginTop: spacing.sm, marginLeft: 44 + 8 },
  subtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  roleBadge: { alignSelf: "flex-start", backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.xs },
  roleBadgeText: { color: colors.onBrandTertiary, fontSize: fontSize.sm, fontFamily: font.medium },

  searchBar: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginTop: -spacing.sm, marginBottom: spacing.sm, ...shadow.raised },
  searchBarText: { color: colors.onSurfaceTertiary, fontSize: fontSize.sm },

  hubQuestion: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickGridItem: { width: "31%", backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: "center", gap: spacing.xs, ...shadow.card },
  quickGridIcon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  quickGridLabel: { fontSize: fontSize.sm, color: colors.onSurface, textAlign: "center", fontFamily: font.medium },

  quickActionRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  quickActionCardWrap: { flex: 1, borderRadius: radius.lg, ...shadow.raised },
  quickActionPrimary: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  quickActionPrimaryText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  quickActionPrimarySubtext: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
  quickActionSecondary: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  quickActionSecondaryText: { color: colors.onSurface, fontSize: fontSize.base, fontFamily: font.medium },
  quickActionSecondarySubtext: { color: colors.onSurfaceSecondary, fontSize: 11, marginTop: 2 },

  allServicesRow: { flexDirection: "row", gap: spacing.sm, justifyContent: "center", marginBottom: spacing.sm },
  allServicesCard: { width: "31%", backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xs, alignItems: "center", gap: 2, ...shadow.card },
  allServicesSubtitle: { fontSize: 10, color: colors.onSurfaceTertiary, textAlign: "center" },
  trustBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.brandPrimary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl },
  trustBannerIcon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  trustBannerTitle: { color: "#fff", fontSize: fontSize.sm, fontFamily: font.medium },
  trustBannerSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 1 },
  allServicesIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  allServicesLabel: { fontSize: fontSize.sm, color: colors.onSurface, textAlign: "center", fontFamily: font.medium },

  nearbyHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nearbySeeAll: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },
  nearbyCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, marginTop: spacing.sm, ...shadow.card },
  nearbyAvatar: { width: 44, height: 44, borderRadius: radius.pill },
  nearbyAvatarPlaceholder: { backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  nearbyBody: { flex: 1 },
  nearbyName: { fontSize: fontSize.sm, fontFamily: font.medium, color: colors.onSurface },
  nearbyMeta: { fontSize: 12, color: colors.onSurfaceSecondary, marginTop: 2 },
  nearbyBadge: { backgroundColor: "#DCFCE7", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  nearbyBadgeText: { fontSize: 11, color: "#16A34A", fontFamily: font.medium },

  summaryRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.raised,
  },
  summaryCardLight: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  summaryValueLight: { color: colors.onBrandPrimary, fontSize: fontSize["2xl"], fontFamily: font.medium, marginTop: spacing.sm },
  summaryLabelLight: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, marginTop: 2 },
  summaryValue: { color: colors.onSurface, fontSize: fontSize["2xl"], fontFamily: font.medium, marginTop: spacing.sm },
  summaryLabel: { color: colors.onSurfaceSecondary, fontSize: fontSize.sm, marginTop: 2 },

  quickRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  quickCard: { flex: 1, alignItems: "center", gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  quickLabel: { fontSize: fontSize.sm, color: colors.onSurface, fontFamily: font.medium, textAlign: "center" },

  websiteBridge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  websiteBridgeText: { flex: 1, fontSize: fontSize.sm, color: colors.onSurface },

  transportCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, ...shadow.card },
  transportHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  transportTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  transportSubtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 4 },
  transportBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: "center", marginTop: spacing.md },
  transportBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  transportDriverLink: { alignItems: "center", marginTop: spacing.md },
  transportDriverLinkText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  sectionLink: { fontSize: fontSize.sm, color: colors.brandPrimary },

  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCardBody: { flex: 1 },
  alertCardTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  typeBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 1 },
  typeBadgeDemand: { backgroundColor: colors.brandPrimary },
  typeBadgeOffer: { backgroundColor: colors.brandSecondary },
  typeBadgeText: { color: colors.onBrandPrimary, fontSize: 9, fontFamily: font.medium },
  alertCardTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  alertCardMeta: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.success },

  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  activityIconWrap: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  activityIconWrapUnread: { backgroundColor: colors.brandTertiary },
  activityBody: { flex: 1 },
  activityText: { fontSize: fontSize.sm, color: colors.onSurface },
  activityTime: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: 2 },

  emptyState: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, ...shadow.card },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: fontSize.base, color: colors.onSurface, textAlign: "center", fontFamily: font.medium },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xs },
  emptyAction: { marginTop: spacing.md, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emptyActionText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
});

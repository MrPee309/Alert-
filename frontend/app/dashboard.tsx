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
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { useUserRole } from "@/src/hooks/use-user-role";
import { dealAlertsApi, type DealAlert } from "@/src/api/deal-alerts";
import { alertsApi } from "@/src/api/alerts";
import { WEBSITE_URL } from "@/src/constants/config";
import type { AppNotification } from "@/src/types";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";
import { BottomNav } from "@/src/components/BottomNav";
import { NotificationBell } from "@/src/components/NotificationBell";

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brandPrimary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Bonjou, {user?.fullName?.split(" ")[0] || "zanmi"} 👋</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColors[0] + "22" }]}>
              <Text style={[styles.roleBadgeText, { color: roleColors[1] }]}>{roleLabel}</Text>
            </View>
          </View>
          <NotificationBell />
        </View>

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

        {/* Primary alert list — label changes by role */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {isClient ? "Demann Mwen" : isSupplier ? "Òf Mwen" : "Alèt Mwen"}
          </Text>
          <Pressable onPress={() => router.push("/my-alerts")} testID="dashboard-see-all-alerts">
            <Text style={styles.sectionLink}>Wè tout</Text>
          </Pressable>
        </View>

        {primaryList.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title={isClient ? "Ou poko gen okenn Demann." : isSupplier ? "Ou poko gen okenn Òf." : "Ou poko gen okenn alèt aktif."}
            subtitle="Kreye premye alèt ou pou kòmanse jwenn deal otomatikman."
            actionLabel={isClient ? "Kreye yon Demann" : isSupplier ? "Kreye yon Òf" : "Kreye yon Alèt"}
            onAction={() => router.push("/create-alert")}
          />
        ) : (
          primaryList.slice(0, 3).map((a) => (
            <Pressable
              key={a.id}
              style={styles.alertCard}
              onPress={() => router.push({ pathname: "/alert-details", params: { id: a.id } })}
              testID={`dashboard-alert-${a.id}`}
            >
              <View style={styles.alertIconWrap}>
                <Ionicons name={a.alert_type === "OFFER" ? "cube" : "search"} size={18} color={colors.brandPrimary} />
              </View>
              <View style={styles.alertCardBody}>
                <View style={styles.alertCardTitleRow}>
                  <View style={[styles.typeBadge, a.alert_type === "OFFER" ? styles.typeBadgeOffer : styles.typeBadgeDemand]}>
                    <Text style={styles.typeBadgeText}>{a.alert_type === "OFFER" ? "ÒF" : "DEMANN"}</Text>
                  </View>
                  <Text style={styles.alertCardTitle} numberOfLines={1}>{alertLabel(a)}</Text>
                </View>
                <Text style={styles.alertCardMeta}>
                  {a.max_price ? `Max: $${a.max_price} · ` : ""}
                  {[a.department, a.city].filter(Boolean).join(", ") || "Tout Ayiti"}
                </Text>
              </View>
              <View style={styles.activeDot} />
            </Pressable>
          ))
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
            <View key={n.id} style={styles.activityRow} testID={`dashboard-activity-${n.id}`}>
              <View style={[styles.activityDot, !n.read && styles.activityDotUnread]} />
              <View style={styles.activityBody}>
                <Text style={styles.activityText} numberOfLines={2}>{n.message}</Text>
                <Text style={styles.activityTime}>{timeAgo(n.createdAt)}</Text>
              </View>
            </View>
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

  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerText: { flex: 1 },
  greeting: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },
  subtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  roleBadge: { alignSelf: "flex-start", backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: spacing.xs },
  roleBadgeText: { color: colors.onBrandTertiary, fontSize: fontSize.sm, fontFamily: font.medium },

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

  activityRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: spacing.sm },
  activityDot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: "transparent", marginTop: 7 },
  activityDotUnread: { backgroundColor: colors.brandPrimary },
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

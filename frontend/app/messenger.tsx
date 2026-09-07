import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Image, TextInput } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { messagesApi, type Conversation } from "@/src/api/messages";
import { BottomNav } from "@/src/components/BottomNav";
import { NotificationBell } from "@/src/components/NotificationBell";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "kounye a";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}è`;
  return `${Math.floor(hrs / 24)}j`;
}

export default function MessengerScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setConversations(await messagesApi.listConversations());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Messenger is not a general user directory — there is no "search all
  // DealLakay users" here. This search only filters conversations that
  // already exist (i.e. an authorized relationship already produced them),
  // matching "Rechèch yon chat..." rather than "find anyone."
  const filteredConversations = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = (c.product_title || c.other_user?.username || "").toLowerCase();
      return name.includes(q);
    });
  }, [conversations, searchText]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messenger</Text>
        <NotificationBell />
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.onSurfaceTertiary} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Rechèch yon chat..."
          placeholderTextColor={colors.onSurfaceTertiary}
          testID="messenger-search-input"
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.onSurfaceTertiary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brandPrimary} />}
        ListHeaderComponent={filteredConversations.length > 0 && !searchText ? <Text style={styles.sectionLabel}>Konvèsasyon ou yo</Text> : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.onSurfaceTertiary} />
            {searchText ? (
              <Text style={styles.emptyText}>Nou pa jwenn okenn chat ki matche.</Text>
            ) : (
              <>
                <Text style={styles.emptyTitle}>Pa gen konvèsasyon ankò</Text>
                <Text style={styles.emptyText}>
                  Kontakte yon teknisyen, vandè, oswa reponn a yon Demann/Òf pou kòmanse yon konvèsasyon.
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: "/conversation-details", params: { id: item.id } })}
            testID={`conversation-${item.id}`}
          >
            <View style={styles.avatarWrap}>
              {item.other_user?.avatar ? (
                <Image source={{ uri: item.other_user.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>{item.other_user?.username?.[0]?.toUpperCase() || "?"}</Text>
                </View>
              )}
              <View style={[styles.onlineDot, styles.onlineDotCorner, item.other_user?.online ? styles.onlineDotActive : styles.onlineDotInactive]} />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowTopLine}>
                <Text style={[styles.rowName, item.unread > 0 && styles.rowNameUnread]} numberOfLines={1}>
                  {item.product_title || `@${item.other_user?.username}`}
                </Text>
                <Text style={styles.rowTime}>{timeAgo(item.updated_at)}</Text>
              </View>
              <Text style={[styles.rowMessage, item.unread > 0 && styles.rowMessageUnread]} numberOfLines={1}>
                {item.last_message || "Kòmanse konvèsasyon an..."}
              </Text>
            </View>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unread > 9 ? "9+" : item.unread}</Text>
              </View>
            )}
          </Pressable>
        )}
      />
      <BottomNav active="messenger" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  loadingContainer: { flex: 1, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: fontSize.base, color: colors.onSurface },

  sectionLabel: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, fontFamily: font.medium, marginBottom: spacing.sm, marginTop: spacing.xs },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"] },
  emptyState: { alignItems: "center", gap: spacing.xs, paddingTop: spacing["2xl"], paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.xs },
  emptyText: { color: colors.onSurfaceSecondary, fontSize: fontSize.sm, textAlign: "center" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 44, height: 44, borderRadius: radius.pill },
  avatarLetter: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
  onlineDot: { width: 10, height: 10, borderRadius: radius.pill },
  onlineDotCorner: { position: "absolute", bottom: 0, right: 0, borderWidth: 2, borderColor: colors.surface },
  onlineDotActive: { backgroundColor: colors.success },
  onlineDotInactive: { backgroundColor: colors.onSurfaceTertiary },
  rowBody: { flex: 1 },
  rowTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowName: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  rowNameUnread: { fontFamily: font.medium },
  rowTime: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary },
  rowMessage: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  rowMessageUnread: { color: colors.onSurface, fontFamily: font.medium },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadBadgeText: { color: colors.onBrandPrimary, fontSize: 10, fontFamily: font.medium },
});

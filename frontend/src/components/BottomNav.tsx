import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { messagesApi } from "@/src/api/messages";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export type BottomTab = "akey" | "alet" | "messenger" | "profil";

const TABS: { key: BottomTab; label: string; icon: keyof typeof Ionicons.glyphMap; route: "/dashboard" | "/alerts-hub" | "/messenger" | "/profile" }[] = [
  { key: "akey", label: "Akèy", icon: "home", route: "/dashboard" },
  { key: "alet", label: "Alèt", icon: "notifications", route: "/alerts-hub" },
  { key: "messenger", label: "Messenger", icon: "chatbubble-ellipses", route: "/messenger" },
  { key: "profil", label: "Profil", icon: "person", route: "/profile" },
];

export function BottomNav({ active }: { active: BottomTab }) {
  const [messengerUnread, setMessengerUnread] = useState(0);

  useEffect(() => {
    messagesApi
      .listConversations()
      .then((list) => setMessengerUnread(list.reduce((sum, c) => sum + c.unread, 0)))
      .catch(() => undefined);
  }, []);

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          const badgeCount = tab.key === "messenger" ? messengerUnread : 0;
          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => {
                if (!isActive) router.replace(tab.route);
              }}
              testID={`bottom-nav-${tab.key}`}
            >
              <View>
                <Ionicons
                  name={isActive ? tab.icon : (`${tab.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                  size={22}
                  color={isActive ? colors.brandPrimary : colors.onSurfaceTertiary}
                />
                {badgeCount > 0 && (
                  <View style={styles.dot}>
                    <Text style={styles.dotText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.surface },
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    ...shadow.card,
  },
  tab: { flex: 1, alignItems: "center", gap: 2 },
  label: { fontSize: 11, color: colors.onSurfaceTertiary },
  labelActive: { color: colors.brandPrimary, fontFamily: font.medium },
  dot: {
    position: "absolute",
    top: -3,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  dotText: { color: colors.onError, fontSize: 9, fontFamily: font.medium },
});

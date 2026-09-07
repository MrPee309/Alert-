import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { alertsApi } from "@/src/api/alerts";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

/** Top-right notification bell — reused across Akèy, Alèt, Messenger, Profil
 * headers per the current navigation structure (Notifications moved out of
 * the bottom tabs, but the Notification Center itself is unchanged). */
export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    alertsApi
      .getNotifications()
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  return (
    <Pressable style={styles.iconButton} onPress={() => router.push("/notifications")} testID="notification-bell" hitSlop={8}>
      <Ionicons name="notifications-outline" size={22} color={colors.onSurface} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.onError, fontSize: 9, fontFamily: font.medium },
});

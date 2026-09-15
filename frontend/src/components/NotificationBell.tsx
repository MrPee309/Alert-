import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { alertsApi } from "@/src/api/alerts";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

/** Top-right notification bell — reused across Akèy, Alèt, Messenger, Profil
 * headers per the current navigation structure (Notifications moved out of
 * the bottom tabs, but the Notification Center itself is unchanged).
 * Optional `color` prop for screens with a dark/gradient header (defaults
 * to the existing dark onSurface color everywhere else, unchanged). */
export function NotificationBell({ color }: { color?: string } = {}) {
  const [unread, setUnread] = useState(0);
  // FIXED: the button's own background was hardcoded solid white, so
  // passing color={white} for a dark/gradient header made the icon
  // invisible against its own circle. Now the circle itself adapts too —
  // translucent white on dark headers, solid white (unchanged) elsewhere.
  const isOnDark = !!color;

  useEffect(() => {
    alertsApi
      .getNotifications()
      .then((list) => setUnread(list.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  return (
    <Pressable
      style={[styles.iconButton, isOnDark && styles.iconButtonOnDark]}
      onPress={() => router.push("/notifications")}
      testID="notification-bell"
      hitSlop={8}
    >
      <Ionicons name="notifications-outline" size={22} color={color || colors.onSurface} />
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
  iconButtonOnDark: {
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowOpacity: 0,
    elevation: 0,
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

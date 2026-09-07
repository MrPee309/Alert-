import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "@/src/context/auth-context";
import { authApi } from "@/src/api/auth";
import { BottomNav } from "@/src/components/BottomNav";
import { NotificationBell } from "@/src/components/NotificationBell";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // No manual navigation needed after logout: Stack.Protected in
  // _layout.tsx watches `user` directly and swaps the entire navigator tree
  // back to the unauthenticated group (bell/welcome screen) the moment
  // `user` becomes null — this screen (and Dashboard, etc.) is unmounted
  // along with it, so there's nothing left in history for Back to reach.

  const handleLogout = () => {
    Alert.alert("Dekonekte", "Ou sèten ou vle dekonekte?", [
      { text: "Anile", style: "cancel" },
      {
        text: "Dekonekte",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Otorizasyon", "Ou dwe otorize aksè a foto ou pou chanje avata w.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    const mime = result.assets[0].mimeType || "image/jpeg";
    const dataUrl = `data:${mime};base64,${result.assets[0].base64}`;

    setUploadingAvatar(true);
    try {
      const avatar = await authApi.updateAvatar(dataUrl);
      await updateUser({ avatarUri: avatar });
    } catch (e: any) {
      Alert.alert("Erè", e?.message || "Nou pa kapab anrejistre foto a.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <NotificationBell />
        </View>

        <View style={styles.profileCard}>
          <Pressable style={styles.avatarWrap} onPress={pickAvatar} disabled={uploadingAvatar} testID="profile-avatar-picker">
            {user.avatarUri ? (
              <Image source={{ uri: user.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{user.fullName?.[0]?.toUpperCase() || "?"}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.onBrandPrimary} />
              ) : (
                <Ionicons name="camera" size={14} color={colors.onBrandPrimary} />
              )}
            </View>
          </Pressable>
          <Text style={styles.fullName}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.emailVerified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          ) : (
            <View style={styles.unverifiedBadge}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
              <Text style={styles.unverifiedText}>Email pa verifye</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <MenuRow icon="person-outline" label="Enfòmasyon Pèsonèl" onPress={() => router.push("/personal-info")} testID="profile-personal-info" />
          <MenuRow icon="notifications-outline" label="Alèt Ou Yo" onPress={() => router.push("/my-alerts")} testID="profile-my-alerts" />
          <MenuRow icon="mail-unread-outline" label="Notifikasyon Ou Yo" onPress={() => router.push("/notifications")} testID="profile-notifications" />
          <MenuRow icon="options-outline" label="Paramèt" onPress={() => router.push("/alert-settings")} testID="profile-settings" />
          <MenuRow icon="shield-checkmark-outline" label="Sekirite" onPress={() => router.push("/security")} testID="profile-security" />
          <MenuRow icon="help-circle-outline" label="Èd & Sipò" onPress={() => router.push("/help-support")} testID="profile-help" last />
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout} testID="profile-logout">
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Dekoneksyon</Text>
        </Pressable>
      </ScrollView>
      <BottomNav active="profil" />
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  testID,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.menuRow, last && styles.menuRowLast]} onPress={onPress} testID={testID}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.sm, marginBottom: spacing.md },
  headerTitle: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },

  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center", ...shadow.raised },
  avatarImage: { width: 72, height: 72, borderRadius: radius.pill, ...shadow.raised },
  avatarLetter: { color: colors.onBrandPrimary, fontSize: fontSize["2xl"], fontFamily: font.medium },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  fullName: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.md },
  email: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  verifiedText: { color: colors.success, fontSize: fontSize.sm, fontFamily: font.medium },
  unverifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.sm },
  unverifiedText: { color: colors.warning, fontSize: fontSize.sm, fontFamily: font.medium },

  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", ...shadow.card },
  menuRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  menuRowLast: { borderBottomWidth: 0 },
  menuIconWrap: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },

  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, marginTop: spacing.xl },
  logoutText: { color: colors.error, fontSize: fontSize.base, fontFamily: font.medium },
});

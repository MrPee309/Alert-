/**
 * Home/Dashboard header — implements the exact technical spec provided
 * (exact SVG wave path, exact gradient stops, exact decorative-circle
 * opacities/positions, exact content-zone percentages). Values here are
 * NOT approximated — they come directly from that spec, normalized to a
 * 0–100 SVG viewBox and to percentages of the real header height/width.
 * Home-specific only (Login's header stays on the separate WaveHeader).
 */
import React from "react";
import { View, Text, Pressable, Image, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from "react-native-svg";

import { NotificationBell } from "@/src/components/NotificationBell";
import { colors as themeColors, spacing, radius, fontSize, font } from "@/src/constants/theme";

const HOME_HEADER_RATIO = 0.38;
const COLORS = {
  deepBlue: "#1D4ED8",
  blue: "#2563EB",
  purple: "#7C3AED",
  lightPurple: "#A78BFA",
  silhouette: "#C7D2FE",
  white: "#FFFFFF",
};

export function HomeHeader({ greetingName }: { greetingName: string }) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const headerHeight = screenHeight * HOME_HEADER_RATIO;
  const logoWidth = screenWidth * 0.34;
  const glowSize = screenWidth * 0.62;
  const palmWidth = screenWidth * 0.38;

  return (
    <View style={{ height: headerHeight, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="headerGradient" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor={COLORS.deepBlue} />
            <Stop offset="45%" stopColor={COLORS.blue} />
            <Stop offset="100%" stopColor={COLORS.purple} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#headerGradient)" />
        <Path
          d="M 0 77 C 15 82, 27 91, 42 90 C 58 89, 69 76, 81 70 C 89 66, 95 68, 100 72 L 100 100 L 0 100 Z"
          fill={COLORS.white}
        />
      </Svg>

      {/* Decorative circles — exact spec values, in real pixels derived
          from screenWidth/headerHeight rather than the SVG's normalized
          space, since these are plain Views layered on top of it. */}
      <View pointerEvents="none" style={{ position: "absolute", width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: COLORS.white, opacity: 0.1, right: -screenWidth * 0.2, top: -screenWidth * 0.18 }} />
      <View pointerEvents="none" style={{ position: "absolute", width: screenWidth * 0.48, height: screenWidth * 0.48, borderRadius: (screenWidth * 0.48) / 2, backgroundColor: COLORS.lightPurple, opacity: 0.08, left: screenWidth * 0.64, top: headerHeight * 0.42 }} />
      <View pointerEvents="none" style={{ position: "absolute", width: screenWidth * 0.07, height: screenWidth * 0.07, borderRadius: (screenWidth * 0.07) / 2, backgroundColor: COLORS.white, opacity: 0.1, left: screenWidth * 0.12, top: headerHeight * 0.18 }} />
      <View pointerEvents="none" style={{ position: "absolute", width: screenWidth * 0.04, height: screenWidth * 0.04, borderRadius: (screenWidth * 0.04) / 2, backgroundColor: COLORS.white, opacity: 0.12, left: screenWidth * 0.82, top: headerHeight * 0.34 }} />

      {/* Palm-tree silhouette — reuses the project's existing asset per
          the spec's "use existing asset if available" instruction. */}
      <Image
        pointerEvents="none"
        source={require("@/assets/images/palm-trees-header.png")}
        resizeMode="contain"
        style={{ position: "absolute", left: 0, bottom: 0, width: palmWidth, height: headerHeight * 0.43, opacity: 0.2, tintColor: COLORS.silhouette }}
      />

      <SafeAreaView edges={["top"]} style={StyleSheet.absoluteFillObject}>
        {/* LOGO — 10–13% of header height down, centered, above decorations (zIndex 10). */}
        <View style={{ alignItems: "center", marginTop: headerHeight * 0.1, zIndex: 10 }}>
          <Image source={require("@/assets/images/deallakay-icon.png")} style={{ width: logoWidth * 0.4, height: logoWidth * 0.4, borderRadius: radius.md }} />
          <Text style={{ color: "#fff", fontFamily: font.display, fontSize: fontSize.base, marginTop: 4 }}>
            Deal<Text style={{ color: "#93C5FD" }}>Lakay</Text> Alèt
          </Text>
        </View>

        {/* BELL — exact spec: 44x44, rgba(255,255,255,0.14), top-right. */}
        <View style={{ position: "absolute", right: 20, top: insets.top + 8, zIndex: 10 }}>
          <NotificationBell color="#fff" />
        </View>

        {/* GREETING — 27–38% zone. */}
        <View style={{ marginTop: headerHeight * 0.27 - headerHeight * 0.1 - logoWidth * 0.4 - 20, paddingHorizontal: spacing.lg, zIndex: 5 }}>
          <Text style={{ color: "#fff", fontSize: fontSize.sm }}>Bonjou,</Text>
          <Text style={{ color: "#fff", fontSize: fontSize.xl, fontFamily: font.medium }}>{greetingName} 👋</Text>
        </View>

        {/* SEARCH BAR — 40–55% zone. */}
        <Pressable
          onPress={() => router.push("/search-results")}
          testID="dashboard-search-bar"
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: radius.lg, height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, gap: spacing.sm, zIndex: 5 }}
        >
          <Ionicons name="search" size={20} color={themeColors.onSurfaceTertiary} />
          <Text style={{ color: themeColors.onSurfaceSecondary, fontSize: fontSize.sm }}>Chèche pwodwi, teknisyen...</Text>
        </Pressable>

        {/* PRIMARY ACTION — 55–63% zone. */}
        <Pressable
          onPress={() => router.push("/make-a-demand")}
          testID="dashboard-quick-demand"
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: radius.lg, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, zIndex: 5 }}
        >
          <Ionicons name="megaphone-outline" size={18} color={themeColors.brandPrimary} />
          <Text style={{ color: themeColors.brandPrimary, fontFamily: font.medium, fontSize: fontSize.sm }}>Fè yon Demand</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

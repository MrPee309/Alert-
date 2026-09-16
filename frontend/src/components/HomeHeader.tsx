/**
 * Home/Dashboard header — implements the refined, comprehensive spec
 * (exact SVG wave path, exact gradient stops, exact decorative-circle
 * opacities/positions, exact logo/tagline/bell dimensions). This version
 * restores the tagline (dropped in an earlier pass) and tightens values
 * against the more detailed follow-up spec.
 */
import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";

import { NotificationBell } from "@/src/components/NotificationBell";
import { font } from "@/src/constants/theme";

const HOME_HEADER_RATIO = 0.24;
const COLORS = {
  deepBlue: "#1D4ED8",
  blue: "#2563EB",
  purple: "#7C3AED",
  lightPurple: "#A78BFA",
  silhouette: "#C7D2FE",
};

export function HomeHeader() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const headerHeight = screenHeight * HOME_HEADER_RATIO;
  const glowSize = screenWidth * 0.62;
  const palmWidth = screenWidth * 0.3;
  const hPad = screenWidth * 0.0615;

  return (
    <View style={{ height: headerHeight, overflow: "hidden" }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="homeHeaderGradient" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor={COLORS.deepBlue} />
            <Stop offset="45%" stopColor={COLORS.blue} />
            <Stop offset="100%" stopColor={COLORS.purple} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#homeHeaderGradient)" />
        <Path
          d="M 0 77 C 15 82, 27 91, 42 90 C 58 89, 69 76, 81 70 C 89 66, 95 68, 100 72 L 100 100 L 0 100 Z"
          fill="#FFFFFF"
        />
      </Svg>

      <View pointerEvents="none" style={{ position: "absolute", width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: "#fff", opacity: 0.1, right: -glowSize * 0.2, top: -glowSize * 0.18 }} />
      <View pointerEvents="none" style={{ position: "absolute", width: screenWidth * 0.48, height: screenWidth * 0.48, borderRadius: (screenWidth * 0.48) / 2, backgroundColor: COLORS.lightPurple, opacity: 0.08, left: screenWidth * 0.6, top: headerHeight * 0.4 }} />
      <View pointerEvents="none" style={{ position: "absolute", width: screenWidth * 0.06, height: screenWidth * 0.06, borderRadius: (screenWidth * 0.06) / 2, backgroundColor: "#fff", opacity: 0.1, left: screenWidth * 0.12, top: headerHeight * 0.16 }} />

      <Image
        pointerEvents="none"
        source={require("@/assets/images/palm-trees-header.png")}
        resizeMode="contain"
        style={{ position: "absolute", right: screenWidth * 0.02, bottom: headerHeight * 0.05, width: palmWidth, height: headerHeight * 0.18, opacity: 0.22, tintColor: COLORS.silhouette }}
      />

      <SafeAreaView edges={["top"]} style={StyleSheet.absoluteFillObject}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: hPad, marginTop: 12, zIndex: 10 }}>
          <Image source={require("@/assets/images/deallakay-icon.png")} style={{ width: 56, height: 56, borderRadius: 18 }} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: "#fff", fontFamily: font.display, fontSize: 22, lineHeight: 24 }}>
              Deal<Text style={{ color: "#93C5FD" }}>Lakay</Text>
            </Text>
            <Text style={{ color: "#fff", fontFamily: font.display, fontSize: 22, lineHeight: 24 }}>Alèt</Text>
          </View>
          <NotificationBell color="#fff" />
        </View>

        <Text style={{ color: "#fff", fontSize: 14, marginTop: 6, marginLeft: hPad + 68 }}>
          Enfòmasyon ki itil, opòtinite ki pi pre w !
        </Text>

        <View
          style={{
            position: "absolute",
            left: hPad,
            right: hPad,
            top: insets.top + 76,
            height: 64,
            backgroundColor: "#fff",
            borderRadius: 32,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 18,
            gap: 10,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Ionicons name="search" size={22} color={COLORS.purple} />
          <Text style={{ color: "#8A8DA6", fontSize: 15 }}>Chèche pwodwi, sèvis, teknisyen...</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

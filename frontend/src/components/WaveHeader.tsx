/**
 * Shared diagonal-wave gradient header background (Login/Register only —
 * Home now uses its own HomeHeader.tsx with the fuller spec). Updated to
 * the exact 3-stop gradient and exact wave path from the reference spec,
 * replacing the earlier safer approximation.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from "react-native-svg";

export function WaveHeader({
  height,
  children,
}: {
  height: number;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ height, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id="waveGradient" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0%" stopColor="#1D4ED8" />
            <Stop offset="45%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#7C3AED" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#waveGradient)" />
        <Path
          d="M 0 77 C 15 82, 27 91, 42 90 C 58 89, 69 76, 81 70 C 89 66, 95 68, 100 72 L 100 100 L 0 100 Z"
          fill="#FFFFFF"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </View>
  );
}

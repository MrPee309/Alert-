/**
 * Shared diagonal-wave gradient header background, used by both the Home
 * (dashboard.tsx) and Login/Register screens so the "wave" shape stays
 * pixel-identical everywhere it's used instead of being redrawn per screen.
 * Uses react-native-svg (added specifically for this — the earlier
 * rounded-bottom-corner LinearGradient was an approximation while that
 * dependency wasn't installed yet).
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

export function WaveHeader({
  height,
  children,
}: {
  /** Total height of the header, including the wave's tallest point. */
  height: number;
  children?: React.ReactNode;
}) {
  const W = 400; // viewBox width — scales to any real screen width via preserveAspectRatio "none"
  const H = 100; // viewBox height, mapped to the real `height` prop
  return (
    <View style={{ height }}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <SvgLinearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#7C3AED" />
            <Stop offset="1" stopColor="#2563EB" />
          </SvgLinearGradient>
        </Defs>
        {/* Diagonal wave: taller on the right, dips down-left, matching the
            reference mockup's "upper-right to lower-left" curve. */}
        <Path
          d={`M0,${H * 0.62} C ${W * 0.22},${H * 0.8} ${W * 0.38},${H * 0.55} ${W * 0.58},${H * 0.6} C ${W * 0.78},${H * 0.65} ${W * 0.88},${H * 0.92} ${W},${H * 0.8} L${W},0 L0,0 Z`}
          fill="url(#waveGradient)"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </View>
  );
}

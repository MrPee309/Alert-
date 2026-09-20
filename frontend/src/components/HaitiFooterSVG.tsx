/**
 * Haiti decorative footer illustration for the Login/Register screens —
 * implemented as native SVG (react-native-svg) per an exact geometric
 * spec, replacing the earlier raster-image approach. Normalized to a
 * 0–100 x 0–34 viewBox (≈2.95:1 aspect ratio) and scaled responsively
 * to the available screen width.
 *
 * NOTE: the spec document was cut off mid-way through section 9 (palm
 * trees) before giving their exact path geometry — only their approximate
 * x/y positions were given. Their shape here (a simple trunk + 4-frond
 * canopy) is my own reasonable approximation to match the rest of the
 * illustration's minimalist style, not a value from the spec.
 */
import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Path, Rect, G } from "react-native-svg";

const SILHOUETTE = "#C7D2FE";
const CITADELLE_FILL = "#AFC0F5";
const FLAGPOLE = "#7A8FD8";
const HAITI_BLUE = "#00209F";
const HAITI_RED = "#D21034";

function PalmTree({ x, yTop, yBottom }: { x: number; yTop: number; yBottom: number }) {
  const trunkTopY = yTop + (yBottom - yTop) * 0.35;
  return (
    <G opacity={0.5}>
      {/* Trunk */}
      <Path d={`M ${x} ${yBottom} L ${x + 0.4} ${trunkTopY}`} stroke={SILHOUETTE} strokeWidth={0.5} fill="none" />
      {/* Canopy — 4 simple fronds fanning from the trunk top */}
      <Path
        d={`M ${x + 0.4} ${trunkTopY}
            C ${x - 2} ${trunkTopY - 1.5}, ${x - 3.5} ${trunkTopY - 0.5}, ${x - 4} ${trunkTopY + 0.5}
            C ${x - 2} ${trunkTopY - 0.3}, ${x - 0.5} ${trunkTopY - 0.2}, ${x + 0.4} ${trunkTopY}
            C ${x + 1.5} ${trunkTopY - 1.8}, ${x + 3} ${trunkTopY - 1.2}, ${x + 3.8} ${trunkTopY - 0.2}
            C ${x + 2} ${trunkTopY - 0.4}, ${x + 1} ${trunkTopY - 0.1}, ${x + 0.4} ${trunkTopY}
            C ${x - 0.2} ${trunkTopY - 2.2}, ${x + 0.2} ${trunkTopY - 2.8}, ${x + 1} ${trunkTopY - 2.2}
            C ${x + 0.4} ${trunkTopY - 1.4}, ${x + 0.4} ${trunkTopY - 0.6}, ${x + 0.4} ${trunkTopY}
            Z`}
        fill={SILHOUETTE}
      />
    </G>
  );
}

export function HaitiFooterSVG() {
  const { width: screenWidth } = Dimensions.get("window");
  const height = screenWidth / 2.95;

  return (
    <View style={{ width: "100%", height, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 34" preserveAspectRatio="none">
        {/* 4. Left decorative landscape — large pale hill entering from the left edge */}
        <Path
          d="M 0 3 C 8 3, 18 6, 25 10 C 32 14, 30 22, 22 26 C 12 31, 4 30, 0 27 Z"
          fill={SILHOUETTE}
          opacity={0.4}
        />

        {/* 5. Lower foreground wave — exact path from spec, scaled to viewBox height (34, not 100) */}
        <Path
          d="M 0 16.32 C 4.08 18.7, 6.8 22.1, 10.88 23.12 C 15.3 24.14, 18.36 21.76, 21.76 20.4 C 25.84 18.7, 29.58 16.32, 34 15.3 L 34 34 L 0 34 Z"
          fill={SILHOUETTE}
          opacity={0.42}
        />

        {/* 6. Right-side hills rising toward the Citadelle */}
        <Path
          d="M 45 30 C 55 24, 62 18, 75 12 C 85 8, 93 6, 100 5 L 100 34 L 45 34 Z"
          fill={SILHOUETTE}
          opacity={0.48}
        />

        {/* 7. Citadelle Laferrière — simplified fortress silhouette */}
        <G opacity={0.62}>
          <Rect x="72" y="14" width="16" height="9" fill={CITADELLE_FILL} />
          <Path d="M 72 14 L 74 10 L 76 14 L 78 11 L 80 14 L 82 10 L 84 14 L 86 11 L 88 14 Z" fill={CITADELLE_FILL} />
          <Rect x="78.5" y="8" width="4" height="6" fill={CITADELLE_FILL} />
        </G>

        {/* 8. Haitian flag — small, on a thin flagpole above the Citadelle */}
        <Path d="M 89.5 9 L 89.5 2" stroke={FLAGPOLE} strokeWidth={0.3} />
        <Rect x="89.5" y="2" width="4.5" height="1.3" fill={HAITI_BLUE} />
        <Rect x="89.5" y="3.3" width="4.5" height="1.3" fill={HAITI_RED} />

        {/* 9. Palm trees — positions per spec; shape is my own approximation (see note above) */}
        <PalmTree x={47} yTop={16} yBottom={26.5} />
        <PalmTree x={54} yTop={13} yBottom={24.8} />
        <PalmTree x={61} yTop={12} yBottom={23.8} />
        <PalmTree x={67} yTop={15} yBottom={23.1} />
      </Svg>
    </View>
  );
}

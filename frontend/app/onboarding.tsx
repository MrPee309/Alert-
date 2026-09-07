import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from "react-native-reanimated";

import { storage } from "@/src/utils/storage";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_SEEN_KEY = "dla.onboarding_seen";
const HERO_HEIGHT = 340;

// ---------------- Shared floating-motion hook ----------------
function useFloat(distance = 8, duration = 2400, delay = 0) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distance, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

function usePulse(duration = 1600, delay = 0) {
  const o = useSharedValue(0.4);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, []);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}

// ---------------- Page 1: Receive Alerts Immediately ----------------
function Hero1() {
  const float = useFloat(10, 2600);
  const glow = usePulse(1800);
  return (
    <View style={styles.heroWrap}>
      <LinearGradient colors={[colors.brandPrimary, colors.brandSecondary]} style={styles.heroBg} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} />
      <Animated.View style={[styles.glowDot, { top: 30, left: 24 }, glow]} />
      <Animated.View style={[styles.glowDot, { bottom: 50, right: 30, width: 60, height: 60 }, glow]} />

      <Animated.View style={[styles.notifCard, float]}>
        <BlurView intensity={40} tint="light" style={styles.notifCardBlur}>
          <View style={styles.notifRow}>
            <LinearGradient colors={[colors.brandPrimary, colors.brandSecondary]} style={styles.notifIcon}>
              <Ionicons name="notifications" size={18} color={colors.onBrandPrimary} />
            </LinearGradient>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>New Match</Text>
            </View>
          </View>
          <Text style={styles.notifTitle}>iPhone 13 Pro Max OLED</Text>
          <Text style={styles.notifMeta}>$38 · 8 available</Text>
          <View style={styles.notifDivider} />
          <Text style={styles.notifCaption}>Match found for your alert</Text>
        </BlurView>
      </Animated.View>
    </View>
  );
}

// ---------------- Page 2: Personalized Alerts ----------------
const CHIP_2 = [
  { icon: "phone-portrait-outline" as const, label: "Ekran", top: 10, left: 12, rotate: "-6deg" },
  { icon: "pricetag-outline" as const, label: "Pri Alèt", top: 60, right: 8, rotate: "5deg" },
  { icon: "cube-outline" as const, label: "Stock Alèt", top: 175, left: 4, rotate: "4deg" },
  { icon: "search-outline" as const, label: "Wanted", top: 210, right: 20, rotate: "-4deg" },
];

function Hero2() {
  const float0 = useFloat(8, 2200, 0);
  const float1 = useFloat(10, 2600, 150);
  const float2 = useFloat(9, 2400, 300);
  const float3 = useFloat(7, 2100, 450);
  const floats = [float0, float1, float2, float3];

  return (
    <View style={styles.heroWrap}>
      <LinearGradient colors={[colors.surfaceTertiary, colors.surface]} style={styles.heroBg} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
      <View style={styles.centerBadgeWrap}>
        <LinearGradient colors={[colors.brandPrimary, colors.brandSecondary]} style={styles.centerBadge}>
          <Ionicons name="options" size={28} color={colors.onBrandPrimary} />
        </LinearGradient>
      </View>
      {CHIP_2.map((c, i) => (
        <Animated.View
          key={c.label}
          style={[
            styles.floatChip,
            { top: c.top, left: c.left, right: c.right, transform: [{ rotate: c.rotate }] },
            floats[i],
          ]}
        >
          <View style={styles.floatChipIcon}>
            <Ionicons name={c.icon} size={16} color={colors.brandPrimary} />
          </View>
          <Text style={styles.floatChipText}>{c.label}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

// ---------------- Page 3: Never Miss a Deal (most vibrant) ----------------
function Hero3() {
  const float = useFloat(10, 2200);
  const sparklePulse = usePulse(1200);
  const glowA = usePulse(1500, 0);
  const glowB = usePulse(1900, 300);

  return (
    <View style={styles.heroWrap}>
      <LinearGradient colors={[colors.brandSecondary, colors.brandPrimary]} style={styles.heroBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Animated.View style={[styles.glowDot, { top: 24, right: 40, width: 46, height: 46 }, glowA]} />
      <Animated.View style={[styles.glowDot, { bottom: 40, left: 30, width: 36, height: 36 }, glowB]} />

      <Animated.View style={[styles.matchCard, float]}>
        <View style={styles.matchHeaderRow}>
          <Animated.View style={sparklePulse}>
            <Ionicons name="sparkles" size={18} color={colors.brandPrimary} />
          </Animated.View>
          <Text style={styles.matchHeaderText}>NEW MATCH</Text>
        </View>
        <Text style={styles.matchTitle}>iPhone 13 Pro Max OLED</Text>
        <Text style={styles.matchPrice}>$38</Text>
        <Text style={styles.matchAvailability}>8 available</Text>
        <View style={styles.matchCheckRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.matchCheckText}>Matches your alert</Text>
        </View>
        <View style={styles.matchCta}>
          <Text style={styles.matchCtaText}>View Deal</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ---------------- Page 4: Ready to Start ----------------
const ORBIT_ICONS = [
  { icon: "notifications-outline" as const, label: "Alèt", angle: -110 },
  { icon: "flash-outline" as const, label: "Deals", angle: -40 },
  { icon: "git-merge-outline" as const, label: "Match", angle: 30 },
  { icon: "chatbubble-outline" as const, label: "Mesaj", angle: 100 },
  { icon: "storefront-outline" as const, label: "Vandè", angle: -160 },
  { icon: "construct-outline" as const, label: "Teknisyen", angle: 165 },
  { icon: "globe-outline" as const, label: "Founisè", angle: 60 },
];
const ORBIT_RADIUS = 118;

function Hero4() {
  const float = useFloat(8, 2400);
  return (
    <View style={styles.heroWrap}>
      <LinearGradient colors={[colors.surfaceTertiary, colors.surface]} style={styles.heroBg} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <View style={styles.orbitCenterWrap}>
        {ORBIT_ICONS.map((o, i) => {
          const rad = (o.angle * Math.PI) / 180;
          const x = Math.cos(rad) * ORBIT_RADIUS;
          const y = Math.sin(rad) * ORBIT_RADIUS;
          return (
            <Animated.View
              key={o.label}
              entering={FadeIn.delay(150 + i * 90).duration(500)}
              style={[styles.orbitChip, { transform: [{ translateX: x }, { translateY: y }] }]}
            >
              <Ionicons name={o.icon} size={16} color={colors.brandPrimary} />
            </Animated.View>
          );
        })}
        <Animated.View style={[styles.orbitCenter, float]}>
          <LinearGradient colors={[colors.brandPrimary, colors.brandSecondary]} style={styles.orbitCenterGradient}>
            <Ionicons name="checkmark-done" size={30} color={colors.onBrandPrimary} />
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

const SLIDES = [
  {
    key: "alerts",
    Hero: Hero1,
    title: "Resevwa Alèt Imedyatman",
    description: "DealLaKay ap fè w konnen lè yon pwodwi, pyès oswa deal ki enterese w vin disponib.",
  },
  {
    key: "personalized",
    Hero: Hero2,
    title: "Alèt Ki Fèt Pou Ou",
    description: "Ou chwazi sa ki enpòtan pou ou. DealLaKay ede w jwenn pwodwi ak opòtinite ki koresponn ak bezwen ou.",
  },
  {
    key: "match",
    Hero: Hero3,
    title: "Pa Rate Yon Bon Deal",
    description: "Lè gen yon nouvo pwodwi, yon chanjman pri oswa yon match ki enterese w, w ap jwenn notifikasyon an rapid.",
  },
  {
    key: "ready",
    Hero: Hero4,
    title: "Tout Pare Pou Ou",
    description: "Dekouvri deals, swiv alèt ou yo, jwenn match epi kominike fasil ak moun sou DealLaKay.",
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const finish = useCallback(async () => {
    await storage.setItem(ONBOARDING_SEEN_KEY, true);
    router.replace("/");
  }, []);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== index) setIndex(newIndex);
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true });
    setIndex(index + 1);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        {!isLast && (
          <Pressable onPress={finish} testID="onboarding-skip" hitSlop={8}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.flex}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <slide.Hero />
            <View style={styles.textBlock}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={goNext}
          testID="onboarding-next"
        >
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{isLast ? "Kòmanse" : "Next"}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    height: 44,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.brandPrimary, width: 18 },
  skipText: { color: colors.onSurfaceTertiary, fontSize: fontSize.base },

  slide: { flex: 1, paddingHorizontal: spacing.lg },
  heroWrap: {
    height: HERO_HEIGHT,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginTop: spacing.md,
    ...shadow.raised,
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  glowDot: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  // Page 1 — notification card
  notifCard: { position: "absolute", left: 24, right: 24, top: 90, borderRadius: radius.lg, overflow: "hidden", ...shadow.raised },
  notifCardBlur: { backgroundColor: "rgba(255,255,255,0.85)", padding: spacing.md },
  notifRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notifIcon: { width: 32, height: 32, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  notifBadge: { backgroundColor: colors.brandTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  notifBadgeText: { color: colors.onBrandTertiary, fontSize: fontSize.sm, fontFamily: font.medium },
  notifTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.sm },
  notifMeta: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  notifDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  notifCaption: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },

  // Page 2 — personalization chips
  centerBadgeWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerBadge: { width: 72, height: 72, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", ...shadow.raised },
  floatChip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    ...shadow.card,
  },
  floatChipIcon: { width: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  floatChipText: { fontSize: fontSize.sm, color: colors.onSurface, fontFamily: font.medium },

  // Page 3 — match card
  matchCard: {
    position: "absolute",
    left: 32,
    right: 32,
    top: 70,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.raised,
  },
  matchHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  matchHeaderText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium, letterSpacing: 0.5 },
  matchTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.sm },
  matchPrice: { fontSize: fontSize["2xl"], fontFamily: font.medium, color: colors.brandPrimary, marginTop: 2 },
  matchAvailability: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  matchCheckRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  matchCheckText: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  matchCta: { marginTop: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: "center" },
  matchCtaText: { color: colors.onBrandTertiary, fontSize: fontSize.sm, fontFamily: font.medium },

  // Page 4 — orbit
  orbitCenterWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  orbitCenter: { width: 76, height: 76, borderRadius: radius.pill, ...shadow.raised },
  orbitCenterGradient: { flex: 1, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  orbitChip: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },

  textBlock: { marginTop: spacing.xl, paddingHorizontal: spacing.sm },
  slideTitle: { fontSize: fontSize["2xl"], fontFamily: font.medium, color: colors.onSurface, textAlign: "center" },
  slideDescription: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 21,
  },

  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.md },
  button: { borderRadius: radius.pill, overflow: "hidden" },
  buttonPressed: { opacity: 0.9 },
  buttonGradient: { paddingVertical: spacing.md, alignItems: "center" },
  buttonText: { color: colors.onBrandPrimary, fontSize: fontSize.lg, fontFamily: font.medium },
});

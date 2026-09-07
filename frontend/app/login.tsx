import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth, GoogleNeedsLocationError } from "@/src/context/auth-context";
import { useI18n } from "@/src/i18n";
import { signInWithGoogle } from "@/src/services/google-auth";
import { locationsApi, type DealLakayLocation } from "@/src/api/locations";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Only shown when a brand-new Google user needs to finish sign-up.
  const [needsLocation, setNeedsLocation] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const [locations, setLocations] = useState<DealLakayLocation[]>([]);
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");

  const submit = async () => {
    if (!username.trim() || !password) {
      setError("Antre non itilizatè/email ak modpas ou.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      // No manual navigation needed: Stack.Protected in _layout.tsx swaps to
      // the authenticated tree (Dashboard) automatically once `user` updates.
    } catch (e: any) {
      setError(e?.message || "Non itilizatè oswa modpas pa kòrèk.");
    } finally {
      setLoading(false);
    }
  };

  const startGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.cancelled) return;
      if (result.error || !result.idToken) {
        setError(result.error || "Erè pandan koneksyon Google.");
        return;
      }
      try {
        await loginWithGoogle(result.idToken);
        // Stack.Protected handles the redirect once `user` updates.
      } catch (e) {
        if (e instanceof GoogleNeedsLocationError) {
          setPendingIdToken(result.idToken);
          setNeedsLocation(true);
          locationsApi.list().then(setLocations).catch(() => setLocations([]));
        } else {
          setError((e as Error)?.message || "Erè pandan koneksyon Google.");
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const finishGoogleSignup = async () => {
    if (!pendingIdToken || !department || !city) {
      setError("Chwazi depatman ak vil ou.");
      return;
    }
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(pendingIdToken, department, city);
      // Stack.Protected handles the redirect once `user` updates.
    } catch (e: any) {
      setError(e?.message || "Erè pandan fini enskripsyon Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const selectedDep = locations.find((d) => d.name === department);

  if (needsLocation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Kase Dènye Etap la</Text>
          <Text style={styles.subtitle}>Chwazi depatman ak vil ou pou fini kont Google ou a.</Text>

          <Text style={styles.label}>Depatman</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {locations.map((d) => (
              <Chip key={d.id} label={d.name} selected={department === d.name} onPress={() => { setDepartment(d.name); setCity(""); }} />
            ))}
          </ScrollView>

          {!!selectedDep && (
            <>
              <Text style={styles.label}>Vil</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {selectedDep.cities.map((c) => (
                  <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
                ))}
              </ScrollView>
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.button, googleLoading && styles.buttonDisabled]} onPress={finishGoogleSignup} disabled={googleLoading} testID="google-finish-signup">
            {googleLoading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.buttonText}>Fini Enskripsyon an</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Konekte</Text>
            <Text style={styles.subtitle}>Byenvini tounen 👋</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Imèl oswa Non Itilizatè</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="egzanp: jean_dupont"
              placeholderTextColor={colors.onSurfaceTertiary}
              testID="login-username"
            />

            <Text style={styles.label}>Modpas</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Modpas ou"
                placeholderTextColor={colors.onSurfaceTertiary}
                testID="login-password"
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.onSurfaceTertiary} />
              </Pressable>
            </View>

            <Pressable onPress={() => router.push("/forgot-password")} testID="login-forgot-password" style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Bliye modpas?</Text>
            </Pressable>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [styles.button, loading && styles.buttonDisabled, pressed && styles.buttonPressed]}
              onPress={submit}
              disabled={loading}
              testID="login-submit"
            >
              {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.buttonText}>Konekte</Text>}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Oswa</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed]}
              onPress={startGoogle}
              disabled={googleLoading}
              testID="login-google"
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.brandPrimary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={colors.onSurface} />
                  <Text style={styles.googleButtonText}>Kontinye ak Google</Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.push("/register")} testID="login-go-register" style={styles.linkWrap}>
            <Text style={styles.link}>Pa gen kont? Kreye youn</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing["2xl"],
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  header: { alignItems: "center", marginBottom: spacing["2xl"] },
  title: {
    fontSize: fontSize["2xl"],
    fontFamily: font.medium,
    color: colors.onSurface,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.xs,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.onSurface,
  },
  forgotWrap: { alignSelf: "flex-end", marginTop: spacing.sm },
  forgotText: { color: colors.brandPrimary, fontSize: fontSize.sm },
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.onBrandPrimary,
    fontSize: fontSize.lg,
    fontFamily: font.medium,
  },
  dividerRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg, gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { color: colors.onSurfaceTertiary, fontSize: fontSize.sm },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  googleButtonPressed: { backgroundColor: colors.surfaceSecondary },
  googleButtonText: { color: colors.onSurface, fontSize: fontSize.base, fontFamily: font.medium },
  linkWrap: { paddingVertical: spacing.lg, alignItems: "center" },
  link: {
    color: colors.brandPrimary,
    fontSize: fontSize.sm,
  },
  chipRow: { marginTop: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  chipTextSelected: { color: colors.onBrandPrimary, fontFamily: font.medium },
});

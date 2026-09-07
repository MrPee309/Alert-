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

import { useAuth } from "@/src/context/auth-context";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) {
      setError("Antre email ou.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Erè pandan voye lyen an.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Bliye Modpas</Text>
            <Text style={styles.subtitle}>
              {sent ? "Tcheke email ou pou yon lyen reyenisyalizasyon." : "Antre email ou, n ap voye yon lyen pou w reyenisyalize modpas ou."}
            </Text>
          </View>

          {!sent && (
            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="non@egzanp.com"
                placeholderTextColor={colors.onSurfaceTertiary}
                testID="forgot-email"
              />
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading} testID="forgot-submit">
                {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.buttonText}>Voye Lyen an</Text>}
              </Pressable>
            </View>
          )}

          <Pressable onPress={() => router.replace("/login")} testID="forgot-back-login" style={styles.linkWrap}>
            <Text style={styles.link}>Retounen Konekte</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: spacing["2xl"] },
  title: { fontSize: fontSize["2xl"], fontFamily: font.medium, color: colors.onSurface, textAlign: "center" },
  subtitle: { fontSize: fontSize.base, color: colors.onSurfaceSecondary, textAlign: "center", marginTop: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
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
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.onBrandPrimary, fontSize: fontSize.lg, fontFamily: font.medium },
  linkWrap: { paddingVertical: spacing.lg, alignItems: "center" },
  link: { color: colors.brandPrimary, fontSize: fontSize.sm },
});

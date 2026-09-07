import React, { useEffect, useState } from "react";
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
  Switch,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth, GoogleNeedsLocationError } from "@/src/context/auth-context";
import { useI18n } from "@/src/i18n";
import { signInWithGoogle } from "@/src/services/google-auth";
import { locationsApi, type DealLakayLocation } from "@/src/api/locations";
import { PHONE_COUNTRIES } from "@/src/constants/phone-countries";
import { SelectModal, SelectField } from "@/src/components/SelectModal";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

// Password strength: 8+ chars, 1 uppercase, 1 digit, 1 special character.
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,}$/;

export default function RegisterScreen() {
  const { register, loginWithGoogle } = useAuth();
  const { t } = useI18n();

  const [locations, setLocations] = useState<DealLakayLocation[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0].name);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Only used if a brand-new Google sign-up needs department/city.
  const [needsLocation, setNeedsLocation] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);

  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const loadLocations = () => {
    setLocationsLoading(true);
    locationsApi
      .list()
      .then(setLocations)
      .catch(() => setLocations([]))
      .finally(() => setLocationsLoading(false));
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const selectedDep = locations.find((d) => d.name === department);
  const selectedPhoneCountry = PHONE_COUNTRIES.find((c) => c.name === phoneCountry) || PHONE_COUNTRIES[0];

  const submit = async () => {
    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !department ||
      !city
    ) {
      setError("Ranpli tout chan obligatwa yo.");
      return;
    }

    // Phone: exact digit count for the selected country's calling code.
    const phoneDigits = phone.replace(/\D/g, "");
    const [lo, hi] = selectedPhoneCountry.digits;
    if (phoneDigits.length < lo || phoneDigits.length > hi) {
      setError(
        `Nimewo telefòn pa sanble valab pou ${selectedPhoneCountry.name} — li dwe gen ${lo === hi ? lo : `${lo}-${hi}`} chif.`,
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Modpas yo pa menm.");
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      setError("Modpas dwe gen omwen 8 karaktè, yon majiskil, yon chif, ak yon karaktè espesyal.");
      return;
    }
    if (!acceptTerms) {
      setError("Ou dwe aksepte Kondisyon yo.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        phone: `${selectedPhoneCountry.code}${phoneDigits}`,
        password,
        confirmPassword,
        country: phoneCountry,
        department,
        city,
        acceptTerms,
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Erè pandan enskripsyon.");
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

  if (done) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={styles.title}>Verifye Email Ou</Text>
        <Text style={styles.tagline}>
          Nou voye yon lyen verifikasyon nan {email}. Klike sou li, epi
          retounen konekte isit la.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace("/login")} testID="register-go-login">
          <Text style={styles.buttonText}>Ale nan Konekte</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (needsLocation) {
    return (
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Dènye Etap la</Text>
          <Text style={styles.tagline}>Chwazi depatman ak vil ou pou fini kont Google ou a.</Text>

          <SelectField
            label="Depatman"
            placeholder="Chwazi depatman"
            value={department || null}
            onPress={() => setDepartmentModalOpen(true)}
            testID="register-google-department-field"
          />
          <SelectModal
            visible={departmentModalOpen}
            title="Chwazi Depatman"
            options={locations.map((d) => ({ value: d.name, label: d.name }))}
            selected={department || null}
            onSelect={(v) => { setDepartment(v); setCity(""); }}
            onClose={() => setDepartmentModalOpen(false)}
            onRetry={loadLocations}
            loading={locationsLoading}
          />

          {!!selectedDep && (
            <>
              <SelectField
                label="Vil"
                placeholder="Chwazi vil"
                value={city || null}
                onPress={() => setCityModalOpen(true)}
                testID="register-google-city-field"
              />
              <SelectModal
                visible={cityModalOpen}
                title="Chwazi Vil"
                options={selectedDep.cities.map((c) => ({ value: c, label: c }))}
                selected={city || null}
                onSelect={setCity}
                onClose={() => setCityModalOpen(false)}
              />
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.button, googleLoading && styles.buttonDisabled]} onPress={finishGoogleSignup} disabled={googleLoading} testID="register-google-finish">
            {googleLoading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.buttonText}>Fini Enskripsyon an</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Kreye Kont</Text>
          <Text style={styles.tagline}>{t("common.tagline")}</Text>

        <View style={styles.form}>
          <Field label="Non Konplè" required value={fullName} onChangeText={setFullName} testID="register-fullname" />
          <Field label="Non Itilizatè" required value={username} onChangeText={setUsername} autoCapitalize="none" testID="register-username" />
          <Field label="Email" required value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="register-email" />

          <SelectField
            label="Peyi (pou telefòn)"
            placeholder="Chwazi peyi"
            value={phoneCountry ? PHONE_COUNTRIES.find((c) => c.name === phoneCountry)?.name || null : null}
            onPress={() => setCountryModalOpen(true)}
            testID="register-country-field"
          />
          <SelectModal
            visible={countryModalOpen}
            title="Chwazi Peyi"
            options={PHONE_COUNTRIES.map((c) => ({ value: c.name, label: c.code ? `${c.name} (${c.code})` : c.name }))}
            selected={phoneCountry}
            onSelect={setPhoneCountry}
            onClose={() => setCountryModalOpen(false)}
          />

          <Text style={styles.label}>Telefòn<Required /></Text>
          <View style={styles.phoneRow}>
            {!!selectedPhoneCountry.code && (
              <View style={styles.phoneCodeBadge}>
                <Text style={styles.phoneCodeText}>{selectedPhoneCountry.code}</Text>
              </View>
            )}
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={selectedPhoneCountry.digits[0] === selectedPhoneCountry.digits[1] ? `${selectedPhoneCountry.digits[0]} chif` : "nimewo w"}
              placeholderTextColor={colors.onSurfaceTertiary}
              testID="register-phone"
            />
          </View>

          <Field label="Modpas" required value={password} onChangeText={setPassword} secureTextEntry testID="register-password" />
          <Text style={styles.hint}>Omwen 8 karaktè, yon majiskil, yon chif, ak yon karaktè espesyal (!@#$...).</Text>
          <Field label="Konfime Modpas" required value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry testID="register-confirm-password" />

          <SelectField
            label="Depatman"
            placeholder="Chwazi depatman"
            value={department || null}
            onPress={() => setDepartmentModalOpen(true)}
            testID="register-department-field"
          />
          <SelectModal
            visible={departmentModalOpen}
            title="Chwazi Depatman"
            options={locations.map((d) => ({ value: d.name, label: d.name }))}
            selected={department || null}
            onSelect={(v) => { setDepartment(v); setCity(""); }}
            onClose={() => setDepartmentModalOpen(false)}
            onRetry={loadLocations}
            loading={locationsLoading}
          />

          {!!selectedDep && (
            <>
              <SelectField
                label="Vil"
                placeholder="Chwazi vil"
                value={city || null}
                onPress={() => setCityModalOpen(true)}
                testID="register-city-field"
              />
              <SelectModal
                visible={cityModalOpen}
                title="Chwazi Vil"
                options={selectedDep.cities.map((c) => ({ value: c, label: c }))}
                selected={city || null}
                onSelect={setCity}
                onClose={() => setCityModalOpen(false)}
              />
            </>
          )}

          <View style={styles.termsRow}>
            <Switch
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              trackColor={{ false: colors.border, true: colors.brandPrimary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.border}
              testID="register-terms"
            />
            <Text style={styles.termsText}>Mwen aksepte <Text style={styles.termsTextBold}>Kondisyon Itilizasyon</Text> DealLakay yo.<Required /></Text>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading} testID="register-submit">
            {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.buttonText}>Kreye Kont</Text>}
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
            testID="register-google"
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

          <Pressable onPress={() => router.replace("/login")} testID="register-go-login-link">
            <Text style={styles.link}>Ou gen deja yon kont? Konekte</Text>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Required() {
  return <Text style={styles.required}> *</Text>;
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences";
  testID?: string;
}) {
  return (
    <>
      <Text style={styles.label}>{props.label}{props.required && <Required />}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        placeholderTextColor={colors.onSurfaceTertiary}
        testID={props.testID}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing["3xl"], paddingBottom: spacing["2xl"] },
  title: {
    fontSize: fontSize["2xl"],
    fontFamily: font.medium,
    color: colors.brandPrimary,
    textAlign: "center",
  },
  tagline: {
    fontSize: fontSize.base,
    color: colors.onSurfaceSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing["2xl"],
  },
  form: { gap: spacing.xs },
  label: {
    fontSize: fontSize.sm,
    color: colors.onSurfaceSecondary,
    marginTop: spacing.md,
  },
  required: { color: colors.error, fontSize: fontSize.sm, fontFamily: font.medium },
  hint: { fontSize: fontSize.sm, color: colors.onSurfaceTertiary, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  phoneCodeBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  phoneCodeText: { fontSize: fontSize.base, color: colors.onSurface, fontFamily: font.medium },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.onSurface,
    backgroundColor: colors.surfaceSecondary,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  termsText: { flex: 1, fontSize: fontSize.sm, color: colors.onSurface },
  termsTextBold: { fontFamily: font.medium, color: colors.brandPrimary },
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
  link: { color: colors.brandPrimary, fontSize: fontSize.sm, textAlign: "center", marginTop: spacing.lg },
});

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/src/context/auth-context";
import { useUserRole } from "@/src/hooks/use-user-role";
import { dealAlertsApi, type AlertType } from "@/src/api/deal-alerts";
import { locationsApi, type DealLakayLocation } from "@/src/api/locations";
import { SelectModal, SelectField } from "@/src/components/SelectModal";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const CATEGORIES = [
  { value: "phone", label: "Telefòn", icon: "phone-portrait-outline" as const },
  { value: "laptop", label: "Laptop", icon: "laptop-outline" as const },
  { value: "parts", label: "Pyès", icon: "hardware-chip-outline" as const },
  { value: "accessories", label: "Akseswa", icon: "headset-outline" as const },
  { value: "tools", label: "Ekipman", icon: "construct-outline" as const },
];

const CONDITIONS = ["Nèf", "Itilize", "Rekondisyone"];

export default function CreateAlertScreen() {
  const { user } = useAuth();
  const { canCreateOffer, canCreateDemand, roleLabel } = useUserRole();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEdit = !!editId;
  const canOffer = !!(user?.isSeller || user?.isTechnician);

  const [alertType, setAlertType] = useState<AlertType>("DEMAND");
  const [locations, setLocations] = useState<DealLakayLocation[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationsLoading, setLocationsLoading] = useState(false);

  const loadLocations = () => {
    setLocationsLoading(true);
    locationsApi.list().then(setLocations).catch(() => setLocations([])).finally(() => setLocationsLoading(false));
  };

  useEffect(() => {
    loadLocations();
  }, []);

  // Suppliers can't post a DEMAND — if the role finishes loading after this
  // screen already defaulted to "DEMAND", switch it to the one type they're
  // actually allowed to submit, so they don't hit a blocked submit.
  useEffect(() => {
    if (!canCreateDemand && alertType === "DEMAND") {
      setAlertType("OFFER");
    }
  }, [canCreateDemand]);

  useEffect(() => {
    if (!editId) return;
    dealAlertsApi
      .list()
      .then((list) => {
        const existing = list.find((a) => a.id === editId);
        if (existing) {
          setAlertType(existing.alert_type);
          setKeyword(existing.keyword || "");
          setCategory(existing.category);
          setCondition(existing.condition);
          setQuantity(existing.quantity != null ? String(existing.quantity) : "");
          setMaxPrice(existing.max_price != null ? String(existing.max_price) : "");
          setPrice(existing.price != null ? String(existing.price) : "");
          setDescription(existing.description || "");
          setDepartment(existing.department);
          setCity(existing.city);
          if (existing.department) setShowMore(true);
        }
      })
      .catch(() => undefined);
  }, [editId]);

  const selectedDep = locations.find((d) => d.name === department);

  const submit = async () => {
    if (!keyword.trim() && !category && !department) {
      setError("Antre omwen yon kritè (mo kle, kategori, oswa lokasyon).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        alert_type: alertType,
        keyword: keyword.trim() || null,
        category,
        condition,
        quantity: quantity ? Number(quantity) : null,
        description: description.trim() || null,
        department,
        city,
        max_price: alertType === "DEMAND" && maxPrice ? Number(maxPrice) : null,
        price: alertType === "OFFER" && price ? Number(price) : null,
      };
      if (isEdit && editId) {
        await dealAlertsApi.update(editId, payload);
        router.replace({ pathname: "/alert-details", params: { id: editId } });
      } else {
        await dealAlertsApi.create(payload);
        router.replace("/dashboard");
      }
    } catch (e: any) {
      setError(e?.message || "Erè pandan anrejistreman alèt la.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()} testID="create-alert-back" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEdit ? "Modifye alèt la" : "Kreye yon nouvo alèt"}</Text>
        <Text style={styles.subtitle}>Di nou sa w ap chèche a — oswa sa w genyen pou ofri.</Text>

        {!isEdit && (
          <View style={styles.typeRow}>
            <Pressable
              style={[
                styles.typeCard,
                alertType === "DEMAND" && styles.typeCardSelected,
                !canCreateDemand && styles.typeCardDisabled,
              ]}
              onPress={() => canCreateDemand && setAlertType("DEMAND")}
              disabled={!canCreateDemand}
              testID="create-alert-type-demand"
            >
              <Ionicons name="search" size={22} color={alertType === "DEMAND" ? colors.onBrandPrimary : colors.brandPrimary} />
              <Text style={[styles.typeCardTitle, alertType === "DEMAND" && styles.typeCardTitleSelected]}>DEMANN</Text>
              <Text style={[styles.typeCardSubtitle, alertType === "DEMAND" && styles.typeCardSubtitleSelected]}>
                {canCreateDemand ? "Sa m ap chèche" : "Pa disponib pou founisè"}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeCard,
                alertType === "OFFER" && styles.typeCardSelected,
                !canCreateOffer && styles.typeCardDisabled,
              ]}
              onPress={() => canCreateOffer && setAlertType("OFFER")}
              disabled={!canCreateOffer}
              testID="create-alert-type-offer"
            >
              <Ionicons name="cube" size={22} color={alertType === "OFFER" ? colors.onBrandPrimary : colors.brandPrimary} />
              <Text style={[styles.typeCardTitle, alertType === "OFFER" && styles.typeCardTitleSelected]}>ÒF</Text>
              <Text style={[styles.typeCardSubtitle, alertType === "OFFER" && styles.typeCardSubtitleSelected]}>
                {canCreateOffer ? "Sa m genyen/ofri" : "Vandè/Teknisyen/Founisè sèlman"}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Pwodwi / Mo kle</Text>
          <TextInput
            style={styles.input}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Eg. iPhone 13 Pro Max Screen"
            placeholderTextColor={colors.onSurfaceTertiary}
            testID="create-alert-keyword"
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Kategori</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.map((c) => {
              const selected = category === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(selected ? null : c.value)}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  testID={`create-alert-category-${c.value}`}
                >
                  <Ionicons name={c.icon} size={16} color={selected ? colors.onBrandPrimary : colors.brandPrimary} />
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Kantite (opsyonèl)</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Eg. 3"
            placeholderTextColor={colors.onSurfaceTertiary}
            testID="create-alert-quantity"
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Kondisyon (opsyonèl)</Text>
          <View style={styles.chipGrid}>
            {CONDITIONS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCondition(condition === c ? null : c)}
                style={[styles.categoryChip, condition === c && styles.categoryChipSelected]}
                testID={`create-alert-condition-${c}`}
              >
                <Text style={[styles.categoryChipText, condition === c && styles.categoryChipTextSelected]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          {alertType === "DEMAND" ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>Pri Maksimòm (opsyonèl)</Text>
              <TextInput
                style={styles.input}
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
                placeholder="Eg. 50"
                placeholderTextColor={colors.onSurfaceTertiary}
                testID="create-alert-max-price"
              />
            </>
          ) : (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>Pri (opsyonèl)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Eg. 50"
                placeholderTextColor={colors.onSurfaceTertiary}
                testID="create-alert-price"
              />
            </>
          )}

          <Pressable style={styles.moreToggle} onPress={() => setShowMore((s) => !s)} testID="create-alert-more-options">
            <Text style={styles.moreToggleText}>More options</Text>
            <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={16} color={colors.brandPrimary} />
          </Pressable>

          {showMore && (
            <>
              <Text style={styles.label}>Deskripsyon (opsyonèl)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Plis detay..."
                placeholderTextColor={colors.onSurfaceTertiary}
                testID="create-alert-description"
              />

              <SelectField
                label="Depatman (opsyonèl)"
                placeholder="Chwazi depatman"
                value={department}
                onPress={() => setDepartmentModalOpen(true)}
                testID="create-alert-department-field"
              />
              <SelectModal
                visible={departmentModalOpen}
                title="Chwazi Depatman"
                options={locations.map((d) => ({ value: d.name, label: d.name }))}
                selected={department}
                onSelect={(v) => { setDepartment(v); setCity(null); }}
                onClose={() => setDepartmentModalOpen(false)}
                onRetry={loadLocations}
                loading={locationsLoading}
              />

              {!!selectedDep && (
                <>
                  <SelectField
                    label="Vil (opsyonèl)"
                    placeholder="Chwazi vil"
                    value={city}
                    onPress={() => setCityModalOpen(true)}
                    testID="create-alert-city-field"
                  />
                  <SelectModal
                    visible={cityModalOpen}
                    title="Chwazi Vil"
                    options={selectedDep.cities.map((c) => ({ value: c, label: c }))}
                    selected={city}
                    onSelect={setCity}
                    onClose={() => setCityModalOpen(false)}
                  />
                </>
              )}
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={submit} disabled={loading} testID="create-alert-submit">
            {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.submitButtonText}>{isEdit ? "Anrejistre Chanjman" : "Kreye Alèt"}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  title: { fontSize: fontSize.xl, fontFamily: font.medium, color: colors.onSurface },
  subtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },

  typeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  typeCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeCardSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  typeCardDisabled: { opacity: 0.5 },
  typeCardTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: 2 },
  typeCardTitleSelected: { color: colors.onBrandPrimary },
  typeCardSubtitle: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary },
  typeCardSubtitleSelected: { color: "rgba(255,255,255,0.85)" },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.xs },
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
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  categoryChipText: { fontSize: fontSize.sm, color: colors.onSurface },
  categoryChipTextSelected: { color: colors.onBrandPrimary, fontFamily: font.medium },
  moreToggle: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.lg },
  moreToggleText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md },
  submitButton: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.xl },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: colors.onBrandPrimary, fontSize: fontSize.lg, fontFamily: font.medium },
});

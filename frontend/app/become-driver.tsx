import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { transportApi, type ServiceType, type Station } from "@/src/api/transport";
import { locationsApi, type DealLakayLocation } from "@/src/api/locations";
import { SelectModal, SelectField } from "@/src/components/SelectModal";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "moto_taxi", label: "Moto Taxi" },
  { value: "delivery", label: "Livrezon" },
  { value: "moto_taxi_delivery", label: "Moto Taxi + Livrezon" },
];

export default function BecomeDriverScreen() {
  const [locations, setLocations] = useState<DealLakayLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);

  const [department, setDepartment] = useState<string | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [area, setArea] = useState("");
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("moto_taxi");

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLocations = async () => {
    setLocationsLoading(true);
    try {
      setLocations(await locationsApi.list());
    } catch { /* SelectModal shows its own retry state */ } finally {
      setLocationsLoading(false);
    }
  };
  useEffect(() => { loadLocations(); }, []);

  useEffect(() => {
    if (!city) { setStations([]); setStationId(null); return; }
    transportApi.listStations(city).then(setStations).catch(() => setStations([]));
  }, [city]);

  const submit = async () => {
    if (!city) return Alert.alert("Manke enfòmasyon", "Chwazi vil ou.");
    if (!brand.trim() || !model.trim() || !plate.trim()) return Alert.alert("Manke enfòmasyon", "Ranpli mak, modèl, ak plak motosiklèt ou.");
    if (!accept) return Alert.alert("Manke enfòmasyon", "Ou dwe aksepte règ Chofè yo.");
    setSubmitting(true);
    try {
      const res = await transportApi.becomeDriver({
        city,
        area: area.trim(),
        station_id: stationId,
        service_types: [serviceType],
        motorcycle: { brand: brand.trim(), model: model.trim(), year: year ? Number(year) : undefined, color: color.trim(), plate: plate.trim() },
        accept_driver_terms: accept,
      });
      Alert.alert("Demann Voye", res.message, [{ text: "OK", onPress: () => router.replace("/dashboard") }]);
    } catch (e: any) {
      Alert.alert("Erè", e?.message || "Nou pa t ka voye demann ou. Eseye ankò.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="become-driver-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Vin Chofè Moto</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <Ionicons name="bicycle" size={22} color={colors.brandPrimary} />
          <Text style={styles.introText}>Ranpli fòm sa a pou mande vin Chofè Moto DealLakay. Demann ou ap an atant apwobasyon admin anvan ou ka kòmanse resevwa kous.</Text>
        </View>

        <Text style={styles.sectionTitle}>Kote Ou Travay</Text>
        <SelectField label="Depatman" placeholder="Chwazi depatman" value={department} onPress={() => setDepartmentModalOpen(true)} testID="become-driver-department-field" />
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
        {!!department && (
          <SelectField
            label="Vil"
            placeholder="Chwazi vil"
            value={city}
            onPress={() => setCityModalOpen(true)}
            testID="become-driver-city-field"
          />
        )}
        <SelectModal
          visible={cityModalOpen}
          title="Chwazi Vil"
          options={(locations.find((d) => d.name === department)?.cities || []).map((c) => ({ value: c, label: c }))}
          selected={city}
          onSelect={setCity}
          onClose={() => setCityModalOpen(false)}
        />
        <Text style={styles.label}>Zòn (opsyonèl)</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="egzanp: Delmas 33" testID="become-driver-area" />

        <SelectField
          label="Stasyon (opsyonèl)"
          placeholder={city ? "Chwazi stasyon oswa rete Endepandan" : "Chwazi yon vil anvan"}
          value={stations.find((s) => s.id === stationId)?.name || null}
          onPress={() => city && setStationModalOpen(true)}
          testID="become-driver-station-field"
        />
        <SelectModal
          visible={stationModalOpen}
          title="Chwazi Stasyon"
          options={[{ value: "", label: "Endepandan (san stasyon)" }, ...stations.map((s) => ({ value: s.id, label: s.name }))]}
          selected={stationId || ""}
          onSelect={(v) => setStationId(v || null)}
          onClose={() => setStationModalOpen(false)}
        />

        <Text style={styles.sectionTitle}>Kalite Sèvis</Text>
        <View style={styles.pillRow}>
          {SERVICE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setServiceType(opt.value)}
              style={[styles.pill, serviceType === opt.value && styles.pillActive]}
              testID={`become-driver-service-${opt.value}`}
            >
              <Text style={[styles.pillText, serviceType === opt.value && styles.pillTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Motosiklèt Ou</Text>
        <Text style={styles.label}>Mak</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="egzanp: Honda" testID="become-driver-brand" />
        <Text style={styles.label}>Modèl</Text>
        <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="egzanp: CG 125" testID="become-driver-model" />
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Ane (opsyonèl)</Text>
            <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="number-pad" placeholder="2020" testID="become-driver-year" />
          </View>
          <View style={styles.halfCol}>
            <Text style={styles.label}>Koulè</Text>
            <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="Nwa" testID="become-driver-color" />
          </View>
        </View>
        <Text style={styles.label}>Plak</Text>
        <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="egzanp: AA-12345" autoCapitalize="characters" testID="become-driver-plate" />

        <Pressable style={styles.checkRow} onPress={() => setAccept((a) => !a)} testID="become-driver-accept">
          <Ionicons name={accept ? "checkbox" : "square-outline"} size={22} color={accept ? colors.brandPrimary : colors.onSurfaceTertiary} />
          <Text style={styles.checkText}>Mwen aksepte règ ak kondisyon Chofè Moto DealLakay yo.</Text>
        </Pressable>

        <Pressable style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting} testID="become-driver-submit">
          {submitting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.submitText}>Voye Demann</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  introCard: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.brandTertiary, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg },
  introText: { flex: 1, fontSize: fontSize.sm, color: colors.onSurface },
  sectionTitle: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: colors.onSurface },
  row: { flexDirection: "row", gap: spacing.md },
  halfCol: { flex: 1 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  pillText: { fontSize: fontSize.sm, color: colors.onSurface },
  pillTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.xl },
  checkText: { flex: 1, fontSize: fontSize.sm, color: colors.onSurface },
  submitBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.xl },
  submitText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
});

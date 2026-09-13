import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { transportApi } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

const STEPS = ["Pikap", "Destinasyon", "Detay", "Konfime"];
const REASONS = ["Ale lakay", "Travay", "Komisyon", "Lopital", "Lekòl", "Lòt"];

export default function RequestMotoScreen() {
  const { destination: prefillDestination } = useLocalSearchParams<{ destination?: string }>();
  const [step, setStep] = useState(0);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [editingPickup, setEditingPickup] = useState(false);
  const [destination, setDestination] = useState(prefillDestination || "");
  const [passengers, setPassengers] = useState(1);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lokalizasyon Nesesè", "Otorize aksè lokalizasyon pou n ka jwenn yon moto toupre w.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setEditingPickup(false);
      if (!pickupAddress.trim()) setPickupAddress("Kote m ye kounye a");
    } catch {
      Alert.alert("Erè", "Nou pa t ka jwenn pozisyon ou. Eseye ankò.");
    } finally {
      setLocating(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return !!pickupCoords && !!pickupAddress.trim();
    if (step === 1) return !!destination.trim();
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      Alert.alert("Manke enfòmasyon", step === 0 ? "Tape \"Itilize pozisyon mwen\" pou jwenn pikap ou." : "Antre yon destinasyon.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const submit = async () => {
    if (!pickupCoords) return;
    setSubmitting(true);
    try {
      const req = await transportApi.createRequest({
        service_type: "moto_taxi",
        pickup_address: pickupAddress.trim(),
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        destination_address: destination.trim(),
        passenger_count: passengers,
        reason,
        notes: notes.trim(),
      });
      router.replace({ pathname: "/searching-driver", params: { id: req.id } });
    } catch (e: any) {
      Alert.alert("Erè", e?.message || "Nou pa t ka voye demann ou.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={back} testID="request-moto-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Moto Taxi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.stepTabs}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepTab}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]} numberOfLines={1}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 0 && (
          <View>
            <Text style={styles.question}>Kote ou ye?</Text>

            {pickupCoords && (
              <Image
                source={{ uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${pickupCoords.lat},${pickupCoords.lng}&zoom=15&size=400x180&markers=${pickupCoords.lat},${pickupCoords.lng},red-pushpin` }}
                style={styles.mapPreview}
                testID="request-moto-map-preview"
              />
            )}

            {pickupCoords && !editingPickup ? (
              <View style={styles.addressDisplayRow}>
                <Ionicons name="location" size={20} color={colors.brandPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressDisplayText} numberOfLines={1}>{pickupAddress}</Text>
                  <View style={styles.gpsBadge}><Ionicons name="radio-button-on" size={8} color={colors.success} /><Text style={styles.gpsBadgeText}>GPS</Text></View>
                </View>
                <Pressable onPress={() => setEditingPickup(true)} testID="request-moto-edit-pickup">
                  <Text style={styles.editLink}>Korije kote a</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.locationCard}>
                <Ionicons name="location" size={20} color={colors.brandPrimary} />
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.locationInput}
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    placeholder="egzanp: Bòkòl, Léogâne"
                    testID="request-moto-pickup"
                    onSubmitEditing={() => pickupCoords && setEditingPickup(false)}
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}

            <Pressable style={styles.gpsBtn} onPress={useCurrentLocation} disabled={locating} testID="request-moto-use-location">
              {locating ? <ActivityIndicator color={colors.onBrandPrimary} /> : (
                <>
                  <Ionicons name="locate" size={16} color={colors.onBrandPrimary} />
                  <Text style={styles.gpsBtnText}>{pickupCoords ? "Pozisyon jwenn ✓" : "Itilize GPS"}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.question}>Ki kote ou prale?</Text>
            <View style={styles.locationCard}>
              <Ionicons name="flag" size={20} color={colors.brandPrimary} />
              <TextInput
                style={styles.locationInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="Chèche destinasyon..."
                testID="request-moto-destination"
                autoFocus
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.question}>Kantite pasaje</Text>
            <View style={styles.stepperRow}>
              <Pressable style={styles.stepperBtn} onPress={() => setPassengers((p) => Math.max(1, p - 1))} testID="request-moto-passengers-minus">
                <Ionicons name="remove" size={18} color={colors.brandPrimary} />
              </Pressable>
              <Text style={styles.stepperValue}>{passengers} pasaje</Text>
              <Pressable style={styles.stepperBtn} onPress={() => setPassengers((p) => Math.min(4, p + 1))} testID="request-moto-passengers-plus">
                <Ionicons name="add" size={18} color={colors.brandPrimary} />
              </Pressable>
            </View>

            <Text style={[styles.question, { marginTop: spacing.xl }]}>Poukisa ou bezwen moto a?</Text>
            <View style={styles.reasonGrid}>
              {REASONS.map((r) => (
                <Pressable key={r} onPress={() => setReason(r)} style={[styles.reasonChip, reason === r && styles.reasonChipActive]} testID={`request-moto-reason-${r}`}>
                  <Text style={[styles.reasonChipText, reason === r && styles.reasonChipTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.question, { marginTop: spacing.xl }]}>Nòt (opsyonèl)</Text>
            <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} multiline placeholder="Enfòmasyon anplis..." testID="request-moto-notes" />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.question}>Konfime Demann Ou</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}><Ionicons name="location" size={16} color={colors.brandPrimary} /><Text style={styles.summaryText}>{pickupAddress}</Text></View>
              <View style={styles.summaryRow}><Ionicons name="flag" size={16} color={colors.brandPrimary} /><Text style={styles.summaryText}>{destination}</Text></View>
              <View style={styles.summaryRow}><Ionicons name="people" size={16} color={colors.brandPrimary} /><Text style={styles.summaryText}>{passengers} pasaje</Text></View>
              {!!reason && <View style={styles.summaryRow}><Ionicons name="information-circle" size={16} color={colors.brandPrimary} /><Text style={styles.summaryText}>{reason}</Text></View>}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.mainBtn, submitting && { opacity: 0.6 }]} onPress={step === STEPS.length - 1 ? submit : next} disabled={submitting} testID="request-moto-next">
          {submitting ? <ActivityIndicator color={colors.onBrandPrimary} /> : (
            <Text style={styles.mainBtnText}>{step === STEPS.length - 1 ? "Chèche yon moto" : "Kontinye"}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  stepTabs: { flexDirection: "row", backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  stepTab: { flex: 1, alignItems: "center", gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: colors.brandPrimary },
  stepDotText: { fontSize: 11, color: colors.onSurfaceTertiary, fontFamily: font.medium },
  stepDotTextActive: { color: colors.onBrandPrimary },
  stepLabel: { fontSize: 10, color: colors.onSurfaceTertiary, textAlign: "center" },
  stepLabelActive: { color: colors.brandPrimary, fontFamily: font.medium },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  question: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface, marginBottom: spacing.md },
  mapPreview: { width: "100%", height: 160, borderRadius: radius.lg, marginBottom: spacing.md, backgroundColor: colors.surfaceSecondary },
  addressDisplayRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  addressDisplayText: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface },
  gpsBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  gpsBadgeText: { fontSize: 11, color: colors.success, fontFamily: font.medium },
  editLink: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },
  locationCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  locationInput: { flex: 1, fontSize: fontSize.base, color: colors.onSurface },
  gpsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.sm, marginTop: spacing.md },
  gpsBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  stepperBtn: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: fontSize.base, fontFamily: font.medium, color: colors.onSurface, minWidth: 90, textAlign: "center" },
  reasonGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reasonChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  reasonChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  reasonChipText: { fontSize: fontSize.sm, color: colors.onSurface },
  reasonChipTextActive: { color: colors.onBrandPrimary, fontFamily: font.medium },
  notesInput: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: colors.onSurface, height: 80 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, ...shadow.card },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  summaryText: { fontSize: fontSize.base, color: colors.onSurface },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  mainBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center" },
  mainBtnText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
});

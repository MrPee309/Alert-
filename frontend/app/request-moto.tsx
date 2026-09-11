import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { transportApi } from "@/src/api/transport";
import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

export default function RequestMotoScreen() {
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("1");
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
      if (!pickupAddress.trim()) setPickupAddress("Kote m ye kounye a");
    } catch {
      Alert.alert("Erè", "Nou pa t ka jwenn pozisyon ou. Eseye ankò.");
    } finally {
      setLocating(false);
    }
  };

  const submit = async () => {
    if (!pickupCoords) return Alert.alert("Manke enfòmasyon", "Tape \"Itilize pozisyon mwen\" pou n ka jwenn moto toupre w.");
    if (!pickupAddress.trim() || !destination.trim()) return Alert.alert("Manke enfòmasyon", "Ranpli pikap ak destinasyon.");
    setSubmitting(true);
    try {
      const req = await transportApi.createRequest({
        service_type: "moto_taxi",
        pickup_address: pickupAddress.trim(),
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        destination_address: destination.trim(),
        passenger_count: Number(passengers) || 1,
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
        <Pressable onPress={() => router.back()} testID="request-moto-back"><Ionicons name="chevron-back" size={26} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>M Bezwen Yon Moto</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Pikap</Text>
        <TextInput style={styles.input} value={pickupAddress} onChangeText={setPickupAddress} placeholder="egzanp: Delmas 33" testID="request-moto-pickup" />
        <Pressable style={styles.locBtn} onPress={useCurrentLocation} disabled={locating} testID="request-moto-use-location">
          {locating ? <ActivityIndicator color={colors.brandPrimary} /> : (
            <>
              <Ionicons name="locate" size={16} color={colors.brandPrimary} />
              <Text style={styles.locBtnText}>{pickupCoords ? "Pozisyon jwenn ✓" : "Itilize pozisyon mwen"}</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Destinasyon</Text>
        <TextInput style={styles.input} value={destination} onChangeText={setDestination} placeholder="egzanp: Pétion-Ville" testID="request-moto-destination" />

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Kantite Pasaje</Text>
        <TextInput style={styles.input} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" testID="request-moto-passengers" />

        <Text style={[styles.label, { marginTop: spacing.lg }]}>Nòt (opsyonèl)</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={notes} onChangeText={setNotes} multiline placeholder="Enfòmasyon anplis..." testID="request-moto-notes" />

        <Pressable style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting} testID="request-moto-submit">
          {submitting ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.submitText}>Chèche Moto</Text>}
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
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: colors.onSurface },
  locBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm, alignSelf: "flex-start" },
  locBtnText: { fontSize: fontSize.sm, color: colors.brandPrimary, fontFamily: font.medium },
  submitBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.xl },
  submitText: { color: colors.onBrandPrimary, fontSize: fontSize.base, fontFamily: font.medium },
});

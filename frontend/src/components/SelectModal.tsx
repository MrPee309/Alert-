import React from "react";
import { View, Text, Pressable, StyleSheet, Modal, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, radius, fontSize, font, shadow } from "@/src/constants/theme";

interface SelectModalProps<T extends string> {
  visible: boolean;
  title: string;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
  /** Called when the person taps "Eseye Ankò" on an empty list — lets the
   * caller re-run its fetch (e.g. a Render free-tier cold start meant the
   * first request timed out before the backend woke up). */
  onRetry?: () => void;
  loading?: boolean;
}

/** A tap-to-open, scrollable list picker — used for fields (country,
 * department, city) that should feel like a real dropdown rather than a row
 * of horizontally-scrolling chips. */
export function SelectModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  onRetry,
  loading,
}: SelectModalProps<T>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      hardwareAccelerated
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} testID="select-modal-close">
              <Ionicons name="close" size={22} color={colors.onSurfaceSecondary} />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.brandPrimary} />
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              style={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    Pa gen okenn opsyon disponib kounye a — koneksyon an ka pran yon ti tan pou reveye.
                  </Text>
                  {!!onRetry && (
                    <Pressable style={styles.retryButton} onPress={onRetry} testID="select-modal-retry">
                      <Text style={styles.retryButtonText}>Eseye Ankò</Text>
                    </Pressable>
                  )}
                </View>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  testID={`select-modal-option-${item.value}`}
                >
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  {selected === item.value && <Ionicons name="checkmark" size={18} color={colors.brandPrimary} />}
                </Pressable>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** The tappable field that opens a SelectModal. */
export function SelectField({
  label,
  placeholder,
  value,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
      >
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.onSurfaceTertiary} />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "70%",
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { fontSize: fontSize.lg, fontFamily: font.medium, color: colors.onSurface },
  list: { paddingHorizontal: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: { fontSize: fontSize.base, color: colors.onSurface },
  emptyWrap: { alignItems: "center", padding: spacing.xl, gap: spacing.md },
  emptyText: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, textAlign: "center" },
  retryButton: { backgroundColor: colors.brandPrimary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryButtonText: { color: colors.onBrandPrimary, fontSize: fontSize.sm, fontFamily: font.medium },

  fieldLabel: { fontSize: fontSize.sm, color: colors.onSurfaceSecondary, marginTop: spacing.md },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldText: { fontSize: fontSize.base, color: colors.onSurface },
  fieldPlaceholder: { color: colors.onSurfaceTertiary },
});

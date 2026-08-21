import { Text, View, StyleSheet, Image } from "react-native";

import { useI18n } from "@/src/i18n";

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Index() {
  const { t } = useI18n();
  console.log(EXPO_PUBLIC_BACKEND_URL, "EXPO_PUBLIC_BACKEND_URL");

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/app-image.png")}
        style={styles.image}
      />
      <Text style={styles.tagline}>{t("common.tagline")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0c0c",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  tagline: {
    position: "absolute",
    bottom: 60,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});

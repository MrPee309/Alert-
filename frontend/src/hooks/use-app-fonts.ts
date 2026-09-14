// Loads the app's own text fonts. FIXED: no such loader existed before —
// theme.ts referenced "PlusJakartaSans-Regular"/"-Medium" by name, but
// without expo-font's useFonts() actually registering them, every Text
// element was silently falling back to the OS default font on both iOS
// and Android. This also adds Outfit ExtraBold for the "DealLakay Alèt"
// wordmark, matching the website's own Logo.jsx exactly (font-display:
// 'Outfit', font-weight 800).
import { useFonts } from "expo-font";
import { Outfit_800ExtraBold } from "@expo-google-fonts/outfit";

export const useAppFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    "PlusJakartaSans-Regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-Medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    Outfit_800ExtraBold,
  });

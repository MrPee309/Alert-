/**
 * Push notification registration (Emergent managed push).
 *
 * Foundation only: this registers the device's native push token with the
 * backend relay. Push delivery requires a real device build (google-services.json
 * on Android, APNs on iOS) — it does NOT work in Expo Go or web preview, which
 * is expected and handled gracefully here.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { BACKEND_URL } from "@/src/constants/config";

export interface PushRegistrationResult {
  status: "registered" | "denied" | "unsupported" | "error";
  canAskAgain?: boolean;
}

/**
 * Requests permission, fetches the native device token, and registers it with
 * the backend relay. Never throws — returns a status so callers can nudge the
 * user without blocking the app flow.
 */
export async function registerForPush(userId: string): Promise<PushRegistrationResult> {
  if (Platform.OS === "web" || !Device.isDevice) {
    return { status: "unsupported" };
  }

  try {
    // Permission FIRST, then token (playbook order).
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    let canAskAgain = existing.canAskAgain;

    if (finalStatus !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      finalStatus = req.status;
      canAskAgain = req.canAskAgain;
    }

    if (finalStatus !== "granted") {
      return { status: "denied", canAskAgain };
    }

    const tokenResp = await Notifications.getDevicePushTokenAsync();

    if (!BACKEND_URL) return { status: "error" };

    await fetch(`${BACKEND_URL}/api/register-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        platform: Platform.OS,
        device_token: tokenResp.data,
      }),
    });

    return { status: "registered", canAskAgain };
  } catch {
    // Expected in Expo Go / preview — no native FCM/APNs token available.
    return { status: "error" };
  }
}

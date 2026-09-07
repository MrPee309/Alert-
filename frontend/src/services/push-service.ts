/**
 * Push notification registration.
 *
 * Foundation only: this registers the device's native push token with
 * DealLakay itself (POST /push/register, authenticated) — NOT a separate
 * standalone backend. DealLakay is where every notification-worthy event
 * (favorites, messages, reviews, deal alerts, etc.) actually happens, so it's
 * also where the device token needs to live: `create_notification()` on the
 * DealLakay backend triggers the push directly once a token is registered
 * there. Push delivery requires a real device build (google-services.json on
 * Android, APNs on iOS) — it does NOT work in Expo Go or web preview, which
 * is expected and handled gracefully here.
 *
 * DealLakay's backend has no GET endpoint to check whether THIS device is
 * currently registered — only POST /push/register and DELETE
 * /push/unregister. So "enabled" as shown in Alert Settings reflects this
 * device's last successful registration attempt, tracked locally, not a
 * live server-verified status.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { apiClient } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

const PUSH_TOKEN_KEY = "dla.push_token";
const PUSH_ENABLED_KEY = "dla.push_enabled";

export interface PushRegistrationResult {
  status: "registered" | "denied" | "unsupported" | "error";
  canAskAgain?: boolean;
}

/**
 * Requests permission, fetches the native device token, and registers it with
 * DealLakay. Never throws — returns a status so callers can nudge the user
 * without blocking the app flow. Must be called while the user is
 * authenticated (the endpoint derives the owner from the JWT, not a param).
 */
export async function registerForPush(): Promise<PushRegistrationResult> {
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

    await apiClient.post(
      "/push/register",
      { platform: Platform.OS, device_token: tokenResp.data },
      true,
    );

    await storage.setItem(PUSH_TOKEN_KEY, tokenResp.data);
    await storage.setItem(PUSH_ENABLED_KEY, true);

    return { status: "registered", canAskAgain };
  } catch {
    // Expected in Expo Go / preview — no native FCM/APNs token available.
    return { status: "error" };
  }
}

/** Unregisters this device's token from DealLakay (DELETE /push/unregister)
 * and clears the local "enabled" flag. Safe no-op if nothing was registered. */
export async function unregisterFromPush(): Promise<boolean> {
  try {
    const token = await storage.getItem<string | null>(PUSH_TOKEN_KEY, null);
    if (token) {
      await apiClient.delete(`/push/unregister?device_token=${encodeURIComponent(token)}`);
    }
    await storage.setItem(PUSH_ENABLED_KEY, false);
    await storage.removeItem(PUSH_TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}

/** This device's last-known push registration intent (local only — see file
 * header note on why there's no live server-verified status to read). */
export async function getPushEnabledLocally(): Promise<boolean> {
  return storage.getItem<boolean>(PUSH_ENABLED_KEY, false);
}

/**
 * Google Sign-In — reuses DealLakay's EXISTING Google OAuth Web Client ID (the
 * same one already configured for the DealLakay website). No second Google
 * project, no separate client registration needed to test in Expo Go.
 *
 * Uses expo-auth-session's implicit flow to get an `id_token`, which is sent
 * straight to DealLakay's existing POST /auth/google endpoint — the backend
 * verifies it against the same Client ID it already trusts.
 */
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { GOOGLE_CLIENT_ID } from "@/src/constants/config";

WebBrowser.maybeCompleteAuthSession();

const DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

export interface GoogleSignInResult {
  idToken: string | null;
  cancelled: boolean;
  error?: string;
}

/**
 * Opens the Google sign-in flow in an in-app browser and resolves with the
 * ID token. Returns { cancelled: true } if the user backs out, and never
 * throws — callers check `.error` for a message to display.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!GOOGLE_CLIENT_ID) {
    return { idToken: null, cancelled: false, error: "Google login pa konfigire ankò sou app la." };
  }

  const redirectUri = AuthSession.makeRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: { nonce: Math.random().toString(36).slice(2) },
  });

  try {
    await request.makeAuthUrlAsync(DISCOVERY);
    const result = await request.promptAsync(DISCOVERY);

    if (result.type === "cancel" || result.type === "dismiss") {
      return { idToken: null, cancelled: true };
    }
    if (result.type !== "success" || !result.params.id_token) {
      return { idToken: null, cancelled: false, error: "Google pa retounen yon repons valab." };
    }
    return { idToken: result.params.id_token, cancelled: false };
  } catch {
    return { idToken: null, cancelled: false, error: "Erè pandan koneksyon ak Google." };
  }
}

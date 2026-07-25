export const GOOGLE_CLIENT_ID = "269741173127-vl9mvdbs2qqs95a5384ap3ne8326fpai.apps.googleusercontent.com";

const GOOGLE_USER_KEY = "ptolemy:google_user";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
}

/** Decodes the ID token's payload segment -- sufficient for reading identity
 * client-side (name/email/sub) for this MVP. Server-side verification only
 * matters once Pro entitlements are actually enforced by the backend. */
export function decodeGoogleCredential(credential: string): GoogleUser {
  const payload = JSON.parse(atob(credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  return { id: payload.sub, name: payload.name ?? "", email: payload.email ?? "" };
}

export function getGoogleUser(): GoogleUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GOOGLE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setGoogleUser(user: GoogleUser) {
  window.localStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(user));
}

export function signOutGoogleUser() {
  window.localStorage.removeItem(GOOGLE_USER_KEY);
}

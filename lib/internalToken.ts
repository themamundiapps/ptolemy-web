"use client";

/** Caches the short-lived internal JWT (see app/api/internal-token) in
 * memory for its ~5 min lifetime, so an authenticated user's rate-limited
 * calls (Chart Analysis, Chat, Synastry, AI quota) don't round-trip to
 * /api/internal-token on every single request. */
let cached: { token: string; expiresAt: number } | null = null;

export async function getInternalToken(): Promise<string | null> {
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const res = await fetch("/api/internal-token");
  if (!res.ok || res.status === 204) {
    cached = null;
    return null;
  }
  const { token } = (await res.json()) as { token: string };
  // Expire the cache a bit before the token itself does, so a request never
  // goes out with a token that expires mid-flight.
  cached = { token, expiresAt: Date.now() + 4 * 60 * 1000 };
  return token;
}

/** Called on sign-out so a stale token from the previous account can't
 * linger in memory and get attached to a guest or different account's
 * request. */
export function clearInternalToken() {
  cached = null;
}

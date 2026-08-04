"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { claimGuestCharts } from "@/lib/api";
import { getOrCreateDeviceId } from "@/lib/storage";

const CLAIMED_KEY_PREFIX = "ptolemy:charts_claimed_for:";

/** Mounted once at the root layout. The first time a signed-in session is
 * seen for this device, reassigns any charts cast anonymously on it (see
 * createGuestChart in lib/api.ts) to the now-known account -- otherwise
 * they'd stay orphaned server-side forever, associated with a device id
 * nobody can look up again. Marks the device as claimed in localStorage
 * afterward so this doesn't re-hit the backend on every page load. */
export default function ClaimGuestCharts() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    const deviceId = getOrCreateDeviceId();
    if (!deviceId) return;
    const claimedKey = `${CLAIMED_KEY_PREFIX}${deviceId}`;
    if (window.localStorage.getItem(claimedKey)) return;

    claimGuestCharts(deviceId)
      .then(() => window.localStorage.setItem(claimedKey, "1"))
      .catch(() => {
        // Left unmarked on failure so the next mount (e.g. next page load) retries.
      });
  }, [status]);

  return null;
}

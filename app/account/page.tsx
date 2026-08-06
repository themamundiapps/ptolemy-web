"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import AppNav from "@/components/AppNav";
import PaywallModal from "@/components/PaywallModal";
import { clearInternalToken } from "@/lib/internalToken";
import { ApiError, createPortalSession, fetchAiQuota } from "@/lib/api";
import type { AiQuota } from "@/lib/types";

function AccountPageInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("checkout") === "success";
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Real backend truth for plan status (is_pro), not a hardcoded string --
  // matters as soon as manual Pro overrides exist (see backend
  // scripts/grant_pro.py), otherwise a Pro account would see "Free plan"
  // here while every other tab correctly treats it as Pro.
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchAiQuota()
      .then(setQuota)
      .catch(() => {});
  }, [status]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e) {
      setPortalError(e instanceof ApiError ? e.message : "Could not open the billing portal.");
      setPortalLoading(false);
    }
  };

  return (
    <div className="pt-app min-h-screen">
      <AppNav />
      <div className="hub-main" style={{ maxWidth: 560 }}>
        <div className="hub-header">
          <h1>Account</h1>
        </div>

        {status === "loading" && (
          <div className="data-card">
            <p className="empty">Loading your account…</p>
          </div>
        )}

        {status === "unauthenticated" && (
          <div className="data-card">
            <h4>You&apos;re not signed in</h4>
            <p style={{ color: "var(--ink-soft)", marginBottom: 14 }}>
              Sign in with Google to save charts across devices and sync your reading.
            </p>
            <button
              type="button"
              onClick={() => signIn("google")}
              className="border border-ink px-5 py-2 font-cinzel text-xs tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-parchment"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {status === "authenticated" && session.user && (
          <>
            {justSubscribed && (
              <div className="data-card" style={{ borderColor: "var(--bronze)" }}>
                <p style={{ color: "var(--bronze-deep)" }}>
                  Thanks for subscribing! It can take a few seconds for Pro to show up below — refresh if it still
                  says Free plan.
                </p>
              </div>
            )}

            <div className="data-card">
              <h4>Signed in</h4>
              <div className="data-row">
                <div className="d-label">Name</div>
                <div className="d-main">{session.user.name}</div>
              </div>
              <div className="data-row">
                <div className="d-label">Email</div>
                <div className="d-main">{session.user.email}</div>
              </div>
            </div>

            <div className="data-card">
              <h4>Subscription</h4>
              {quota === null ? (
                <p className="empty">Loading…</p>
              ) : quota.is_pro ? (
                <>
                  <p style={{ color: "var(--bronze-deep)", marginBottom: 14 }}>
                    Ptolemy Pro — {quota.limit} consultations/day.
                  </p>
                  <button type="button" className="btn-primary" onClick={handleManageBilling} disabled={portalLoading}>
                    {portalLoading ? "Opening…" : "Manage Billing"}
                  </button>
                  {portalError && <p style={{ color: "var(--terracotta)", marginTop: 10 }}>{portalError}</p>}
                </>
              ) : (
                <>
                  <p className="empty" style={{ marginBottom: 14 }}>
                    Free plan — {quota.limit} consultations/day. Upgrade to Ptolemy Pro for the full traditional
                    toolkit.
                  </p>
                  <button type="button" className="btn-primary" onClick={() => setPaywallOpen(true)}>
                    Upgrade to Pro — $5/mo
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                clearInternalToken();
                signOut();
              }}
              className="border border-ink px-5 py-2 font-cinzel text-xs tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-parchment"
            >
              Sign out
            </button>
          </>
        )}
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountPageInner />
    </Suspense>
  );
}

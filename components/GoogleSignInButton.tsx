"use client";

import { signIn, useSession } from "next-auth/react";

export default function GoogleSignInButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <p className="font-cormorant text-sm text-ink-2">
        Signed in as <span className="text-ink">{session.user.email}</span>
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="border border-ink px-5 py-2 font-cinzel text-xs tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-parchment"
    >
      Sign in with Google
    </button>
  );
}

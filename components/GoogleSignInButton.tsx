"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, decodeGoogleCredential, getGoogleUser, setGoogleUser, type GoogleUser } from "@/lib/auth";

export default function GoogleSignInButton({ onSignedIn }: { onSignedIn?: (user: GoogleUser) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    setUser(getGoogleUser());
  }, []);

  useEffect(() => {
    if (!scriptReady || user || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const googleUser = decodeGoogleCredential(response.credential);
        setGoogleUser(googleUser);
        setUser(googleUser);
        onSignedIn?.(googleUser);
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady, user]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" async defer onLoad={() => setScriptReady(true)} />
      {user ? (
        <p className="text-sm text-muted">
          Signed in as <span className="text-ink">{user.email}</span>
        </p>
      ) : (
        <div ref={buttonRef} />
      )}
    </>
  );
}

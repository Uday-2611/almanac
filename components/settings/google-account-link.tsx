"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/client";
import styles from "./profile-settings.module.css";

type LinkState = "loading" | "available" | "linking" | "linked";

export function GoogleAccountLink({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<LinkState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    authClient.listAccounts()
      .then(({ data, error: accountError }) => {
        if (!active) return;

        if (accountError) {
          setError("Almanac could not check your connected accounts.");
          setState("available");
          return;
        }

        setState(data?.some((account) => account.providerId === "google") ? "linked" : "available");
      })
      .catch(() => {
        if (!active) return;
        setError("Almanac could not check your connected accounts.");
        setState("available");
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  async function connectGoogle() {
    setError(null);
    setState("linking");

    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: "/settings",
      });

      if (result?.error) {
        setError(result.error.message || "Google could not be connected. Please try again.");
        setState("available");
      }
    } catch {
      setError("Almanac could not reach Google. Check your connection and try again.");
      setState("available");
    }
  }

  if (!enabled) return null;

  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>Google account</span>
      <span className={styles.detailValue} aria-live="polite">
        {state === "linked" ? "Connected" : state === "loading" ? "Checking connection…" : "Connect to sign in with Google."}
      </span>
      {state !== "linked" ? (
        <button
          className={styles.textAction}
          type="button"
          disabled={state === "loading" || state === "linking"}
          onClick={connectGoogle}
        >
          {state === "loading" ? "Checking…" : state === "linking" ? "Opening Google…" : "Connect to Google"}
        </button>
      ) : null}
      {error ? <p className={`${styles.error} ${styles.googleLinkError}`} role="alert">{error}</p> : null}
    </div>
  );
}

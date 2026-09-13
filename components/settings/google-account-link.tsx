"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth/client";

type LinkState = "loading" | "available" | "linking" | "linked";

export function GoogleAccountLink({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<LinkState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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
    <section className="mb-16 max-w-2xl" aria-labelledby="connected-accounts-title">
      <h1 id="connected-accounts-title" className="text-xl font-semibold tracking-[-0.02em]">
        Connected accounts
      </h1>
      <p className="mt-3 text-sm leading-6 text-[#686868]">
        Connect Google once, then use it to sign in without entering your Almanac password.
      </p>
      <div className="mt-6 flex items-center gap-4 text-sm">
        <span className="text-[#686868]">Google</span>
        {state === "linked" ? (
          <span>Connected</span>
        ) : (
          <button
            className="ledger-focus font-medium disabled:cursor-wait disabled:text-[#8a8a8a]"
            type="button"
            disabled={state === "loading" || state === "linking"}
            onClick={connectGoogle}
          >
            {state === "loading" ? "Checking..." : state === "linking" ? "Opening Google..." : "Connect +"}
          </button>
        )}
      </div>
      {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
    </section>
  );
}

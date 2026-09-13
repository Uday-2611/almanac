"use client";

import { type FormEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

type AuthMode = "sign-in" | "sign-up";
type PendingMethod = "email" | "google" | null;

const authErrorMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "The email or password is incorrect.",
  USER_ALREADY_EXISTS: "An account already exists for this email. Try signing in instead.",
  EMAIL_NOT_VERIFIED: "Verify your email before signing in.",
  PASSWORD_TOO_SHORT: "Use at least 8 characters for your password.",
  PASSWORD_TOO_LONG: "Use no more than 128 characters for your password.",
};

function authErrorMessage(code: string | undefined, fallback?: string) {
  return (code && authErrorMessages[code]) || fallback || "Authentication failed. Please try again.";
}

export function AuthForm({
  googleEnabled,
  oauthError,
  afterEmailSignIn = "/movies",
}: {
  googleEnabled: boolean;
  oauthError: string | null;
  afterEmailSignIn?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [error, setError] = useState<string | null>(oauthError);
  const [pendingMethod, setPendingMethod] = useState<PendingMethod>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (mode === "sign-up" && name.length < 2) return setError("Enter a name with at least 2 characters.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password.length > 128) return setError("Use no more than 128 characters for your password.");

    setPendingMethod("email");

    try {
      const result = mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(authErrorMessage(result.error.code, result.error.message));
        setPendingMethod(null);
        return;
      }

      startTransition(() => router.replace(afterEmailSignIn));
    } catch {
      setError("Almanac could not reach the sign-in service. Check your connection and try again.");
      setPendingMethod(null);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setPendingMethod("google");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/movies",
        errorCallbackURL: "/login",
      });
      if (result?.error) {
        setError(authErrorMessage(result.error.code, result.error.message));
        setPendingMethod(null);
      }
    } catch {
      setError("Google sign-in could not be started. Check your connection and try again.");
      setPendingMethod(null);
    }
  }

  const pending = pendingMethod !== null;

  return (
    <section className="w-full max-w-sm" aria-labelledby="auth-title">
      <p className="almanac-wordmark mb-14 text-lg font-medium tracking-[-0.025em]">Almanac</p>
      <h1 id="auth-title" className="text-3xl font-medium tracking-[-0.04em]">
        {mode === "sign-in" ? "Welcome back" : "Create your ledger"}
      </h1>
      <p className="mt-2 text-sm text-[#686868]">
        {mode === "sign-in" ? "Sign in to continue to your private collection." : "One account for your movies and books."}
      </p>

      <form className="mt-12 space-y-7" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <label className="block text-sm">
            <span className="mb-2 block text-[#686868]">Name</span>
            <input
              className="ledger-focus w-full border-0 border-b border-[#cfcfcf] bg-transparent px-0 py-2"
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              disabled={pending}
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="mb-2 block text-[#686868]">Email</span>
          <input
            className="ledger-focus w-full border-0 border-b border-[#cfcfcf] bg-transparent px-0 py-2"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            disabled={pending}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block text-[#686868]">Password</span>
          <input
            className="ledger-focus w-full border-0 border-b border-[#cfcfcf] bg-transparent px-0 py-2"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={8}
            maxLength={128}
            disabled={pending}
          />
        </label>

        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}

        <button
          className="ledger-focus text-sm font-medium disabled:cursor-wait disabled:text-[#8a8a8a]"
          type="submit"
          disabled={pending}
        >
          {pendingMethod === "email" ? "Please wait..." : mode === "sign-in" ? "Sign in +" : "Create account +"}
        </button>
      </form>

      {googleEnabled ? (
        <div className="mt-9">
          <div className="mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-black/35">
            <span className="h-px flex-1 bg-black/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <button
            className="ledger-focus w-full bg-black/[0.045] px-4 py-3 text-left text-sm font-medium transition-colors duration-150 hover:bg-black/[0.08] disabled:cursor-wait disabled:text-[#8a8a8a]"
            type="button"
            disabled={pending}
            onClick={handleGoogleSignIn}
          >
            {pendingMethod === "google" ? "Opening Google..." : "Continue with Google"}
          </button>
        </div>
      ) : null}

      <button
        className="ledger-focus mt-10 text-sm text-[#686868] hover:text-[#111111]"
        type="button"
        disabled={pending}
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
      >
        {mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </section>
  );
}

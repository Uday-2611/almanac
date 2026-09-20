"use client";

import { type FormEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import styles from "./auth-shell.module.css";

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

function GoogleIcon() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.92A6.02 6.02 0 0 1 6.1 12c0-.67.11-1.32.31-1.92V7.46H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.54l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.94 5.46l3.35 2.62C7.2 7.71 9.4 5.95 12 5.95Z" />
    </svg>
  );
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
    <section className={styles.formSection} aria-labelledby="auth-title">
      <div className={styles.formHeader}>
        <p>{mode === "sign-in" ? "Your archive is waiting" : "Begin your archive"}</p>
        <h1 id="auth-title">{mode === "sign-in" ? "Welcome back" : "Create an account"}</h1>
        <span>
          {mode === "sign-in"
            ? "Sign in to continue to your private collection."
            : "One quiet place for the films and books you keep."}
        </span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <label className={styles.field}>
            <span className={styles.visuallyHidden}>Name</span>
            <input
              name="name"
              placeholder="Name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              disabled={pending}
            />
          </label>
        ) : null}

        <label className={styles.field}>
          <span className={styles.visuallyHidden}>Email</span>
          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            maxLength={320}
            disabled={pending}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.visuallyHidden}>Password</span>
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={8}
            maxLength={128}
            disabled={pending}
          />
        </label>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={pending}>
          {pendingMethod === "email" ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      {googleEnabled ? (
        <div className={styles.googleSection}>
          <div className={styles.divider}><span>or</span></div>
          <button
            className={styles.googleButton}
            type="button"
            disabled={pending}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            <span>{pendingMethod === "google" ? "Opening Google..." : "Continue with Google"}</span>
          </button>
        </div>
      ) : null}

      <button
        className={styles.modeSwitch}
        type="button"
        disabled={pending}
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
      >
        {mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>

      <p className={styles.privacyNote}>Private by default. Your archive is visible only to you.</p>
    </section>
  );
}

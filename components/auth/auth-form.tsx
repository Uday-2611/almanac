"use client";

import { type FormEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    const result = mode === "sign-up"
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Authentication failed. Please try again.");
      setPending(false);
      return;
    }

    startTransition(() => {
      router.replace("/movies");
      router.refresh();
    });
  }

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
          />
        </label>

        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}

        <button
          className="ledger-focus text-sm font-medium disabled:cursor-wait disabled:text-[#8a8a8a]"
          type="submit"
          disabled={pending}
        >
          {pending ? "Please wait..." : mode === "sign-in" ? "Sign in +" : "Create account +"}
        </button>
      </form>

      <button
        className="ledger-focus mt-10 text-sm text-[#686868] hover:text-[#111111]"
        type="button"
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

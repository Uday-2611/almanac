"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

export function SignOutLink({ onSignedOut, tabIndex }: { onSignedOut?: () => void; tabIndex?: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <button
        className="ledger-focus group flex min-h-11 w-full items-center px-2.5 text-left text-sm text-[#686868] transition-colors duration-150 hover:bg-[#f3f3f3] hover:text-[#111111] disabled:cursor-wait sm:min-h-8"
        type="button"
        disabled={pending}
        tabIndex={tabIndex}
        onClick={async () => {
          setError("");
          setPending(true);
          try {
            const result = await authClient.signOut();
            if (result.error) {
              setError(result.error.message ?? "Sign out failed. Please try again.");
              return;
            }
            onSignedOut?.();
            router.replace("/");
          } catch {
            setError("Sign out failed. Check your connection and try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <span className="transition-transform duration-150 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1">
          {pending ? "Signing out..." : "Sign out"}
        </span>
      </button>
      {error ? <p role="alert" className="px-2.5 py-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

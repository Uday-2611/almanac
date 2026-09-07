"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

export function SignOutLink({ onSignedOut, tabIndex }: { onSignedOut?: () => void; tabIndex?: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      className="ledger-focus group flex min-h-8 w-full items-center px-2.5 text-left text-sm text-[#686868] transition-colors duration-150 hover:bg-[#f3f3f3] hover:text-[#111111] disabled:cursor-wait"
      type="button"
      disabled={pending}
      tabIndex={tabIndex}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        onSignedOut?.();
        router.replace("/");
        router.refresh();
      }}
    >
      <span className="transition-transform duration-150 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1">
        {pending ? "Signing out..." : "Sign out"}
      </span>
    </button>
  );
}

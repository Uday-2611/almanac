"use client";

import { RouteError } from "@/components/states/route-error";

export default function TextsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError message="The journal could not be read. Check your connection and try again." retry={reset} />;
}

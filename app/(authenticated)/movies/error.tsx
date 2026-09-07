"use client";

import { RouteError } from "@/components/states/route-error";

export default function MoviesError({ reset }: { reset: () => void }) {
  return <RouteError message="The movie ledger could not be loaded." reset={reset} />;
}

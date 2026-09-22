"use client";

import { RouteError } from "@/components/states/route-error";

export default function MoviesError({ retry }: { retry: () => void }) {
  return <RouteError message="The movie ledger could not be loaded." retry={retry} />;
}

"use client";

import { RouteError } from "@/components/states/route-error";

export default function BooksError({ reset }: { reset: () => void }) {
  return <RouteError message="The book ledger could not be loaded." reset={reset} />;
}

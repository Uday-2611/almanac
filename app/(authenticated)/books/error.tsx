"use client";

import { RouteError } from "@/components/states/route-error";

export default function BooksError({ retry }: { retry: () => void }) {
  return <RouteError message="The book ledger could not be loaded." retry={retry} />;
}

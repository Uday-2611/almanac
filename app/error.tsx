"use client";

import { RouteError } from "@/components/states/route-error";

export default function AppError({ retry }: { retry: () => void }) {
  return <RouteError message="Almanac could not load this page." retry={retry} />;
}

"use client";

import { RouteError } from "@/components/states/route-error";

export default function AuthenticatedError({ retry }: { retry: () => void }) {
  return <RouteError message="This page could not be loaded." retry={retry} />;
}

import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { MediaSearchProvider } from "@/components/search/media-search-provider";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthenticatedLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <MediaSearchProvider>
      <AppShell>{children}{modal}</AppShell>
    </MediaSearchProvider>
  );
}

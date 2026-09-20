import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LandingExperience } from "@/components/marketing/landing-experience";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "A private cultural archive",
  description:
    "Keep a private, considered record of the films, series, and books that stay with you.",
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/movies");

  return <LandingExperience />;
}

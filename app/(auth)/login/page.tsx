import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/movies");

  const { error } = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="flex min-h-screen items-center px-6 py-16 sm:px-12 lg:px-20">
      <AuthForm googleEnabled={googleEnabled} oauthError={error ? "Google sign-in could not be completed. Please try again." : null} />
    </main>
  );
}

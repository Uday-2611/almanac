import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/movies");

  return (
    <main className="flex min-h-screen items-center px-6 py-16 sm:px-12 lg:px-20">
      <AuthForm />
    </main>
  );
}

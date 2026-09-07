import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/movies");

  return (
    <main>
      <p>Almanac</p>
      <h1>Your private movie and book ledger.</h1>
      <p>The landing page will be designed in the next implementation phase.</p>
      <Link href="/login">Continue to login</Link>
    </main>
  );
}

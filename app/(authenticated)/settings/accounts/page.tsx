import type { Metadata } from "next";

import { GoogleAccountLink } from "@/components/settings/google-account-link";

export const metadata: Metadata = { title: "Connected accounts" };

export default function ConnectedAccountsPage() {
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <main className="min-h-screen px-5 pb-20 pt-36 sm:px-8 sm:pt-44 lg:px-12">
      <GoogleAccountLink enabled={googleEnabled} />
    </main>
  );
}

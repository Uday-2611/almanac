import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LibraryImport } from "@/components/settings/library-import";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "My profile" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen px-5 pb-20 pt-32 sm:px-8 sm:pt-40 lg:px-12">
      <ProfileSettings
        id={user.id}
        initialName={user.name ?? "Almanac reader"}
        initialEmail={user.email}
      >
        <section className="border-t border-[#e8e8e8] py-8 sm:py-16" aria-labelledby="migration-heading">
          <div className="mb-10 grid gap-3 sm:grid-cols-[minmax(7rem,0.32fr)_minmax(0,0.68fr)] sm:gap-8">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#777777]">Migration</p>
            <div className="max-w-2xl">
              <h2 id="migration-heading" className="text-lg font-semibold tracking-[-0.025em]">Import your library</h2>
              <p className="mt-2 text-[0.8125rem] leading-5 text-[#686868]">
                Bring your existing movie and book collections into Almanac once. Export files are read on this device; only the normalized details needed for import are sent to Almanac.
              </p>
            </div>
          </div>
          <div className="sm:ml-[32%]">
            <LibraryImport />
          </div>
        </section>
      </ProfileSettings>
    </main>
  );
}

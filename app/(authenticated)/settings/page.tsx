import type { Metadata } from "next";

import { LibraryImport } from "@/components/settings/library-import";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <main className="min-h-screen px-5 pb-20 pt-36 sm:px-8 sm:pt-44 lg:px-12">
      <div className="mb-12 max-w-2xl">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Import your library</h1>
        <p className="mt-3 text-sm leading-6 text-[#686868]">
          Bring your existing movie and book collections into Almanac once, then continue logging here. Export files are read on this device; only the normalized title details and collection statuses needed for the import are sent to Almanac.
        </p>
      </div>
      <LibraryImport />
    </main>
  );
}

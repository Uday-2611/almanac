import type { Metadata } from "next";

import { ComingSoonPage } from "@/components/states/coming-soon-page";

export const metadata: Metadata = { title: "Texts" };

export default function TextsPage() {
  return <ComingSoonPage section="Texts" description="A place for the words you want to keep." />;
}

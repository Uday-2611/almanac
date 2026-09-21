import type { Metadata } from "next";

import { ComingSoonPage } from "@/components/states/coming-soon-page";

export const metadata: Metadata = { title: "Colors" };

export default function ColorsPage() {
  return <ComingSoonPage section="Colors" description="A place for the colors you want to remember." />;
}

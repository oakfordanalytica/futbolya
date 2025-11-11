import {
  NavbarLandingNavbar,
  SidebarLandingNavbar,
} from "@/components/sections/landing/landing-navbar";

import type { Metadata } from "next";
import { StackedLayout } from "@/components/layouts/stacked-layout";
import { ScoreboardHeader } from "@/components/sections/landing/scoreboard-header";
import { ScoreboardBody } from "@/components/sections/landing/scoreboard-body";
import { PinnedLeagues } from "@/components/sections/landing/pinned-leagues";

export const metadata: Metadata = {
  title: {
    template: "%s - TaxPal",
    default: "TaxPal - Accounting made simple for small businesses",
  },
  description:
    "Most bookkeeping software is accurate, but hard to use. We make the opposite trade-off, and hope you don't get audited.",
};

export default function Home() {
  return (
    <StackedLayout
      fullWidth
      navbar={<NavbarLandingNavbar />}
      sidebar={<SidebarLandingNavbar />}
    >
      <div className="flex gap-6 mx-auto md:pt-8 max-w-7xl w-full md:px-4">
        <main className="flex flex-col gap-4 w-full max-w-4xl antialiased">
          <ScoreboardHeader />
          <ScoreboardBody />
        </main>
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-8">
            <PinnedLeagues />
          </div>
        </aside>
      </div>
    </StackedLayout>
  );
}

import {
  NavbarLandingNavbar,
  SidebarLandingNavbar,
} from "@/components/sections/landing/landing-navbar";

import type { Metadata } from "next";
import clsx from "clsx";
import { StackedLayout } from "@/components/ui/stacked-layout";
import { ScoreboardHeader } from "@/components/sections/landing/scoreboard-header";

export const metadata: Metadata = {
  title: {
    template: "%s - TaxPal",
    default: "TaxPal - Accounting made simple for small businesses",
  },
  description:
    "Most bookkeeping software is accurate, but hard to use. We make the opposite trade-off, and hope you don’t get audited.",
};

export default function Home() {
  return (
    <StackedLayout
      fullWidth
      navbar={<NavbarLandingNavbar />}
      sidebar={<SidebarLandingNavbar />}
    >
      {/*<Header /> */}
      <main className="bg-white antialiased">
        <ScoreboardHeader />
        {/*<Hero />
        <PrimaryFeatures />
        <SecondaryFeatures />
        <CallToAction />
        <Testimonials />
        <Pricing />
        <Faqs />*/}
      </main>
      {/*<Footer />*/}
    </StackedLayout>
  );
}

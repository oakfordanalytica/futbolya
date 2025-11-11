import {
  NavbarLandingNavbar,
  SidebarLandingNavbar,
} from "@/components/sections/landing/landing-navbar";

import type { Metadata } from "next";
import clsx from "clsx";
import { StackedLayout } from "@/components/layouts/stacked-layout";
import { ScoreboardHeader } from "@/components/sections/landing/scoreboard-header";
import { ScoreboardBody } from "@/components/sections/landing/scoreboard-body";

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
      <main className=" flex flex-col gap-4 max-w-4xl antialiased mx-auto md:pt-8">
        <ScoreboardHeader />
        <ScoreboardBody />
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

// ################################################################################
// # File: app\(landing)\layout.tsx                                               #
// # Check: 11/11/2025                                                            #
// ################################################################################

import { StackedLayout } from "@/components/layouts/stacked-layout";
import {
  NavbarLandingNavbar,
  SidebarLandingNavbar,
} from "@/components/sections/landing/landing-navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StackedLayout
      fullWidth
      navbar={<NavbarLandingNavbar />}
      sidebar={<SidebarLandingNavbar />}
    >
      {children}
    </StackedLayout>
  );
}

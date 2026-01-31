import {
  TeamSidebar,
  TeamNavbar,
} from "@/components/sections/shell/teams/team-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { SportProvider } from "@/lib/sports";

type LayoutProps = {
  children: React.ReactNode;
};

export default function TeamLayout({ children }: LayoutProps) {
  // TODO: When Convex is connected, fetch sportType from league data
  const sportType = "basketball" as const;

  return (
    <SportProvider sportType={sportType}>
      <SidebarLayout
        fullWidth
        navbar={<TeamNavbar />}
        sidebar={<TeamSidebar />}
      >
        <main className="flex-1">{children}</main>
      </SidebarLayout>
    </SportProvider>
  );
}

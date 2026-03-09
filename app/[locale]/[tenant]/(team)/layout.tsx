import {
  TeamSidebar,
  TeamNavbar,
} from "@/components/sections/shell/teams/team-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";

type LayoutProps = {
  children: React.ReactNode;
};

export default function TeamLayout({ children }: LayoutProps) {
  return (
    <SidebarLayout fullWidth navbar={<TeamNavbar />} sidebar={<TeamSidebar />}>
      <main className="flex-1">{children}</main>
    </SidebarLayout>
  );
}

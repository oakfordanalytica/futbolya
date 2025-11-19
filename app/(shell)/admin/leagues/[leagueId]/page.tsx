"use client";

import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Container } from "@/components/ui/container";
import { LeagueDetailView } from "@/components/sections/shell/league/league-detail-view";

export default function SuperAdminLeagueDetailPage() {
  const params = useParams();
  const leagueId = params.leagueId as Id<"leagues">;

  return (
    <Container className="py-8">
      <LeagueDetailView 
        leagueId={leagueId} 
        backUrl="/admin/leagues" 
        showDashboardButton={true} 
      />
    </Container>
  );
}
"use client";

import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Container } from "@/components/ui/container";
import { ClubDetailView } from "@/components/sections/shell/club/club-detail-view";

export default function ClubDetailPage() {
  const params = useParams();
  const orgSlug = params.org as string;
  const clubId = params.clubId as Id<"clubs">;

  return (
    <Container className="py-8">
      <ClubDetailView 
        clubId={clubId} 
        backUrl={`/${orgSlug}/admin/clubs`}
        showDashboardButton={false} // League admins just manage, they don't impersonate the dashboard
      />
    </Container>
  );
}
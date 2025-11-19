"use client";

import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Container } from "@/components/ui/container";
import { ClubDetailView } from "@/components/sections/shell/club/club-detail-view";

export default function SuperAdminClubDetailPage() {
  const params = useParams();
  const clubId = params.clubId as Id<"clubs">;

  return (
    <Container className="py-8">
      <ClubDetailView 
        clubId={clubId} 
        backUrl="/admin/clubs" 
        showDashboardButton={true} 
      />
    </Container>
  );
}
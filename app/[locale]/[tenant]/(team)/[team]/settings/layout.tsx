import { SettingsLayout } from "@/components/layouts/settings-layout";

export default async function TeamSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string; team: string }>;
}) {
  const { tenant, team } = await params;

  return (
    <SettingsLayout context="team" orgSlug={tenant} teamSlug={team}>
      {children}
    </SettingsLayout>
  );
}

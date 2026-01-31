import { SignUp } from "@clerk/nextjs";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default async function TenantSignUpPage({ params }: PageProps) {
  const { tenant } = await params;

  return (
    <SignUp
      signInUrl={`/${tenant}/sign-in`}
      forceRedirectUrl={`/${tenant}/applications`}
      unsafeMetadata={{ pendingOrganizationSlug: tenant }}
    />
  );
}

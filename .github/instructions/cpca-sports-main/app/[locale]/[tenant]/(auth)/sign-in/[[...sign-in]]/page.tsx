import { SignIn } from "@clerk/nextjs";

interface PageProps {
  params: Promise<{ tenant: string }>;
}

export default async function TenantSignInPage({ params }: PageProps) {
  const { tenant } = await params;

  return (
    <SignIn
      signUpUrl={`/${tenant}/sign-up`}
      forceRedirectUrl={`/${tenant}/applications`}
    />
  );
}

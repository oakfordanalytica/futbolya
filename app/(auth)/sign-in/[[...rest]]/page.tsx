import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerAction: "hidden",
          },
          layout: {
            socialButtonsPlacement: "bottom",
            socialButtonsVariant: "iconButton",
            termsPageUrl: undefined,
            privacyPageUrl: undefined,
          },
        }}
        signUpUrl={undefined}
        forceRedirectUrl="/"
        routing="path"
        path="/sign-in"
      />
    </div>
  );
}
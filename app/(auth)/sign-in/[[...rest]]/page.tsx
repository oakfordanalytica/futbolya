"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <style jsx global>{`
        .cl-footerAction,
        .cl-footerActionLink {
          display: none !important;
        }
      `}</style>
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
            footerAction: "hidden",
            footerActionLink: "hidden",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
          },
          layout: {
            socialButtonsPlacement: "bottom",
            socialButtonsVariant: "iconButton",
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
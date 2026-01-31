// ################################################################################
// # Check: 12/13/2025                                                            #
// ################################################################################

import { ROUTES } from "@/lib/navigation/routes";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <SignIn signUpUrl={ROUTES.auth.signUp} />;
}

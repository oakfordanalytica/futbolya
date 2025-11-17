import { Container } from "@/components/ui/container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <Container className="py-16">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to FutbolYa!</CardTitle>
          <CardDescription>
            Your account is ready, but you haven&apos;t been assigned to any
            organizations yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Please contact your league or club administrator to get access. Once
            they add you to their organization, you&apos;ll be able to access
            your dashboard.
          </p>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">What&apos;s next?</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Your league or club admin will assign you a role</li>
              <li>You&apos;ll receive an email notification when added</li>
              <li>Sign out and sign back in to access your dashboard</li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this is an error, please contact support at{" "}
              <a
                href="mailto:support@futbolya.com"
                className="text-primary underline"
              >
                support@futbolya.com
              </a>
            </p>

            <SignOutButton>
              <Button variant="outline" className="w-full">
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
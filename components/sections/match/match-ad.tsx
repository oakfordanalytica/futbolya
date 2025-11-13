import { Add } from "@/components/ui/adds";
import { Card, CardContent } from "@/components/ui/card";
import { featureFlags } from "@/lib/config/features";

export function MatchAd() {
  if (!featureFlags.adsEnabled) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-2">
        <Add ratio={3 / 4} />
      </CardContent>
    </Card>
  );
}
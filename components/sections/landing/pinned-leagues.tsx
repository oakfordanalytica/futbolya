// ################################################################################
// # File: pinned-leagues.tsx                                                     #
// # Check: 11/11/2025                                                            #
// ################################################################################

import { Avatar } from "@/components/ui/avatar";
import { StarIcon } from "lucide-react";
import Link from "next/link";
import type { PinnedLeaguesProps } from "@/lib/scoreboard/types";
import { Add } from "@/components/ui/adds";
import { featureFlags } from "@/lib/config/features";

// TODO: Implement this using convex
const PINNED_LEAGUES_HEADING_ID = "pinned-leagues-heading";
const ADS_HEADING_ID = "ads-heading";
// const MY_TEAMS_HEADING_ID = "my-teams-heading";
interface SectionHeaderProps {
  headingId: string;
  title: string;
}

function SectionHeader({ headingId, title }: SectionHeaderProps) {
  return (
    <header className="mb-4 flex items-center gap-2 px-2">
      <StarIcon className="size-4" aria-hidden="true" />
      <h2
        id={headingId}
        className="text-sm font-semibold uppercase tracking-wide"
      >
        {title}
      </h2>
    </header>
  );
}

export function PinnedLeagues({ leagues }: PinnedLeaguesProps) {
  const safeLeagues = leagues ?? [];
  const adsEnabled = featureFlags.adsEnabled;

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby={PINNED_LEAGUES_HEADING_ID}>
        <SectionHeader
          headingId={PINNED_LEAGUES_HEADING_ID}
          title="Pinned Leagues"
        />
        <nav aria-labelledby={PINNED_LEAGUES_HEADING_ID}>
          <ul className="list-none space-y-1 p-0 m-0" role="list">
            {safeLeagues.map((league) => (
              <li key={league.id}>
                <Link
                  href={`/league/${league.id}`}
                  className="flex items-center  gap-3 rounded-lg px-2 py-2 "
                >
                  <Avatar initials={league.flag} className="size-5" square />
                  <span className="text-sm font-medium">{league.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {/*TODO: Implement My Teams section */}
      {/*<section aria-labelledby={MY_TEAMS_HEADING_ID}>
        <SectionHeader headingId={MY_TEAMS_HEADING_ID} title="My Teams" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600"
        >
          <PlusIcon className="size-4" />
          <span className="text-sm font-semibold">ADD THE TEAM</span>
        </Button>
      </section>*/}

      {adsEnabled ? (
        <section aria-labelledby={ADS_HEADING_ID}>
          <SectionHeader headingId={ADS_HEADING_ID} title="Ads" />
          <Add ratio={16 / 9} />
        </section>
      ) : null}
    </div>
  );
}

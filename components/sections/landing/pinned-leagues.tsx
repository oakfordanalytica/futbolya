import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlusIcon, StarIcon } from "lucide-react";
import type { PinnedLeague } from "@/lib/mocks/types";

interface PinnedLeaguesProps {
  leagues?: PinnedLeague[];
}

export function PinnedLeagues({ leagues }: PinnedLeaguesProps) {
  const safeLeagues = leagues ?? [];

  return (
    <div className="space-y-6">
      {/* Pinned Leagues Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <StarIcon className="size-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Pinned Leagues
          </h2>
        </div>
        <nav className="space-y-1">
          {safeLeagues.map((league) => (
            <a
              key={league.id}
              href={`/league/${league.id}`}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar initials={league.flag} className="size-5" square />
              <span className="text-sm font-medium">{league.name}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* My Teams Section */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <StarIcon className="size-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            My Teams
          </h2>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600"
        >
          <PlusIcon className="size-4" />
          <span className="text-sm font-semibold">ADD THE TEAM</span>
        </Button>
      </div>
    </div>
  );
}

import Image from "next/image";

export function MatchLineupsTeamBadge({
  team,
  label,
}: {
  team: { name: string; logoUrl?: string };
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      {team.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt={team.name}
          width={18}
          height={18}
          className="size-4 object-contain sm:size-[18px]"
        />
      ) : (
        <div className="flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground sm:size-[18px] sm:text-[10px]">
          {team.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="truncate text-xs font-semibold sm:text-sm">{label}</span>
    </div>
  );
}

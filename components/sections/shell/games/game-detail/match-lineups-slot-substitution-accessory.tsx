import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MatchLineupsSlotSubstitutionAccessory({
  slotId,
  tooltipLines,
}: {
  slotId: string;
  tooltipLines: string[];
}) {
  if (tooltipLines.length === 0) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="absolute -right-2 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-background/90 text-[10px] font-semibold leading-none text-foreground shadow-sm"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          ↕
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" className="px-3 py-2">
        <div className="space-y-1 text-xs">
          {tooltipLines.map((line, index) => (
            <p key={`${slotId}-substitution-${index}`}>{line}</p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

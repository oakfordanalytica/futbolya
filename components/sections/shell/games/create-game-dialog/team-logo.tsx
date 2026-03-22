import Image from "next/image";
import type { Club } from "./types";

export function TeamLogo({
  club,
  size = 20,
}: {
  club?: Club | null;
  size?: number;
}) {
  if (club?.logoUrl) {
    return (
      <Image
        src={club.logoUrl}
        alt={club.name}
        width={size}
        height={size}
        className="rounded-full object-contain"
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {club?.name?.charAt(0).toUpperCase() ?? "?"}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FootballFieldSurfaceProps {
  className?: string;
  children?: ReactNode;
}

export function FootballFieldSurface({
  className,
  children,
}: FootballFieldSurfaceProps) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full rounded-lg",
        "bg-gradient-to-b from-green-500 to-green-600 dark:from-green-700 dark:to-green-800",
        "border-2 border-white/40 p-2 overflow-hidden",
        "flex flex-col-reverse justify-around",
        className,
      )}
    >
      <div className="absolute top-1/2 left-1/2 h-auto w-[30%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
      <div className="absolute top-1/2 left-0 h-0.5 w-full bg-white/40" />

      <div className="absolute top-[0%] left-[20%] h-[16%] w-[60%] rounded-b-sm border-2 border-t-0 border-white/40" />
      <div className="absolute top-[0%] left-[35%] h-[8%] w-[30%] rounded-b-sm border-2 border-t-0 border-white/40" />
      <div className="absolute top-[12%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/60" />

      <div className="absolute bottom-[0%] left-[20%] h-[16%] w-[60%] rounded-t-sm border-2 border-b-0 border-white/40" />
      <div className="absolute bottom-[0%] left-[35%] h-[8%] w-[30%] rounded-t-sm border-2 border-b-0 border-white/40" />
      <div className="absolute bottom-[12%] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/60" />

      <div className="absolute top-0 left-0 h-4 w-4 rounded-br-full border-2 border-t-0 border-l-0 border-white/40" />
      <div className="absolute top-0 right-0 h-4 w-4 rounded-bl-full border-2 border-t-0 border-r-0 border-white/40" />
      <div className="absolute bottom-0 left-0 h-4 w-4 rounded-tr-full border-2 border-b-0 border-l-0 border-white/40" />
      <div className="absolute bottom-0 right-0 h-4 w-4 rounded-tl-full border-2 border-b-0 border-r-0 border-white/40" />

      {children}
    </div>
  );
}

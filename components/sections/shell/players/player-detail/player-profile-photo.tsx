"use client";

import { useState } from "react";
import Image from "next/image";
import { imageHasTransparency } from "@/lib/files/image-transparency";
import { cn } from "@/lib/utils";

export function PlayerProfilePhoto({
  src,
  alt,
  primaryColor,
}: {
  src: string;
  alt: string;
  primaryColor: string;
}) {
  const [transparent, setTransparent] = useState(false);

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3 z-20 sm:left-8 lg:left-16",
        transparent
          ? "bottom-0 size-[172px] sm:size-[182px] lg:size-[274px]"
          : "bottom-4 size-36 rounded-full p-1 shadow-xl ring-1 ring-white/40 sm:size-40 lg:bottom-5 lg:size-56",
      )}
      style={
        transparent
          ? undefined
          : {
              background: `linear-gradient(135deg, #fff, ${primaryColor} 55%, #fff)`,
            }
      }
    >
      <div
        className={cn(
          "relative size-full",
          !transparent && "overflow-hidden rounded-full",
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 172px, (max-width: 1024px) 182px, 274px"
          crossOrigin="anonymous"
          onLoad={(event) =>
            setTransparent(imageHasTransparency(event.currentTarget))
          }
          className={
            transparent
              ? "object-contain object-bottom"
              : "object-cover object-top"
          }
        />
      </div>
    </div>
  );
}

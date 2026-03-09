import { cn } from "@/lib/utils";

interface JerseyIconProps {
  color?: string;
  number?: string | number;
  size?: number;
  className?: string;
}

function normalizeHexColor(color?: string) {
  if (!color) {
    return "#A5A6A7";
  }

  return color.startsWith("#") ? color : `#${color}`;
}

function getTextColor(hexColor: string) {
  const hex = hexColor.replace("#", "");
  if (hex.length !== 6) {
    return "#FFFFFF";
  }

  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? "#111827" : "#FFFFFF";
}

export function JerseyIcon({
  color,
  number,
  size = 42,
  className,
}: JerseyIconProps) {
  const fillColor = normalizeHexColor(color);
  const textColor = getTextColor(fillColor);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: Math.round(size * 0.97) }}
      aria-hidden
    >
      <svg viewBox="0 0 94.9 92.2" className="size-full drop-shadow-md">
        <path
          fill={fillColor}
          d="M79 10.1c-2.6-4.7-6.7-5.2-10.6-5.7-3.9-.5-11.9-2.7-12.5-2.9-3.2-1-5.8.2-8.5.2-2.8 0-5.4-1.2-8.5-.2-.6.2-8.6 2.3-12.5 2.9-3.9.5-8 1.1-10.6 5.7-2.6 4.7-14.7 25.3-14.7 25.3l16 8.1 6.3-8.8s1.7 14.1 1.7 21.5-1.9 25.2-.8 31.8c0 0 1.1 3.2 22 3.2h2.3c20.9 0 21.9-3.2 21.9-3.2 1.1-6.6-.6-24.3-.6-31.7s1.5-21.6 1.5-21.6l6.3 8.7 16-8.1c.1.1-12.1-20.5-14.7-25.2z"
        />
        <g opacity=".24">
          <path
            fill="#FFF"
            d="M4.764 29.32l16.305 8.307-.5.98L4.265 30.3zM90.317 29.37l.5.982-16.312 8.3-.5-.982zM48.7 85.7h-2.3c-20.3 0-22.3-3-22.6-3.5l1-.4c.1.1 2 2.9 21.5 2.9h2.3C68.1 84.7 70 82 70 81.9l1 .4c0 .5-2 3.4-22.3 3.4z"
          />
        </g>
        <path
          fill="none"
          stroke="#000"
          strokeWidth="2.235"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          d="M79 10.1c-2.6-4.7-6.7-5.2-10.6-5.7-3.9-.5-11.9-2.7-12.5-2.9-3.2-1-5.8.2-8.5.2-2.8 0-5.4-1.2-8.5-.2-.6.2-8.6 2.3-12.5 2.9-3.9.5-8 1.1-10.6 5.7-2.6 4.7-14.7 25.3-14.7 25.3l16 8.1 6.3-8.8s1.7 14.1 1.7 21.5-1.9 25.2-.8 31.8c0 0 1.1 3.2 22 3.2h2.3c20.9 0 21.9-3.2 21.9-3.2 1.1-6.6-.6-24.3-.6-31.7s1.5-21.6 1.5-21.6l6.3 8.7 16-8.1c.1.1-12.1-20.5-14.7-25.2z"
        />
        {number !== undefined && number !== "" ? (
          <text
            x="47.45"
            y="57"
            textAnchor="middle"
            fontSize="28"
            fontWeight="800"
            fill={textColor}
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.25)", strokeWidth: "1.4px" }}
          >
            {number}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

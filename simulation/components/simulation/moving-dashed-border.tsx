import { cn } from "@/lib/utils";

export function MovingDashedBorder({ active = false }: { active?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 210 200"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <rect
        x="2"
        y="2"
        width="206"
        height="196"
        rx="18"
        fill="none"
        strokeWidth="2"
        strokeDasharray="10 8"
        vectorEffect="non-scaling-stroke"
        className={cn("moving-dash", active && "moving-dash-active")}
      />
    </svg>
  );
}

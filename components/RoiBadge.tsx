import type { RoiTier } from "@/lib/types";
import { TIER_COLOR, TIER_LABEL } from "@/lib/format";

export function RoiBadge({ roi, tier }: { roi: number; tier: RoiTier }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold"
      style={{ backgroundColor: `${TIER_COLOR[tier]}22`, color: TIER_COLOR[tier] }}
      title={TIER_LABEL[tier]}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_COLOR[tier] }} />
      ROI {roi}
    </span>
  );
}

export function LowDataBadge({
  confidence,
  sampleSize,
}: {
  confidence: number;
  sampleSize: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400"
      title={`Only ${sampleSize} attendees — ${Math.round(
        confidence * 100
      )}% confidence. ROI is dampened until more data arrives.`}
    >
      ⚠ Low data
    </span>
  );
}

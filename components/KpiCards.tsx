import type { ScoredEvent, RegionAnalytics } from "@/lib/types";

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-50">{value}</div>
      {sub && <div className="text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function KpiCards({
  events,
  regions,
}: {
  events: ScoredEvent[];
  regions: RegionAnalytics[];
}) {
  const totalNewUsers = events.reduce((s, e) => s + e.new_users, 0);
  const avgRoi = events.length
    ? Math.round(events.reduce((s, e) => s + e.roi, 0) / events.length)
    : 0;
  const best = regions[0];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Events tracked" value={String(events.length)} />
      <Card label="New users acquired" value={totalNewUsers.toLocaleString()} />
      <Card label="Average event ROI" value={String(avgRoi)} sub="0–100 composite" />
      <Card
        label="Top region"
        value={best ? best.region : "—"}
        sub={best ? `ROI ${best.roi}` : undefined}
      />
    </div>
  );
}

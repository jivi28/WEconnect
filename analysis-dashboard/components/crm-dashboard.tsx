"use client"

import React, { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Inter } from "next/font/google"
import { aggregateRegions, buildFunnel } from "@/lib/weconnect/roi"
import { TIER_COLOR, TIER_LABEL, fmt, fmtEuro } from "@/lib/weconnect/format"
import type { ScoredEvent } from "@/lib/weconnect/types"
import MapFilters from "./MapFilters"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Initialize the Inter font (mimics the Würth corporate font)
const inter = Inter({ subsets: ["latin"] })

// Leaflet touches `window`, so the map must be client-only.
const EuropeMap = dynamic(() => import("./EuropeMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[#1d252d]/50">
      Loading map…
    </div>
  ),
})

// --- LIQUID GLASS COMPONENTS (LIGHT THEME) ---

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
}

const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
}) => {
  const glassStyle = {
    boxShadow: "0 8px 32px rgba(29, 37, 45, 0.08), 0 0 4px rgba(29, 37, 45, 0.02)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex flex-col overflow-hidden text-[#1d252d] transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit rounded-3xl"
        style={{
          backdropFilter: "blur(8px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit"
        style={{ background: "rgba(255, 255, 255, 0.6)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit rounded-3xl overflow-hidden pointer-events-none"
        style={{
          boxShadow:
            "inset 2px 2px 4px 0 rgba(255, 255, 255, 0.8), inset -1px -1px 4px 0 rgba(29, 37, 45, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
        }}
      />

      {/* Content */}
      <div className="relative z-30 flex flex-col flex-1 min-h-0">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block w-full">
      {content}
    </a>
  ) : (
    content
  );
};

const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves="1"
        seed="17"
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale="5"
        specularConstant="1"
        specularExponent="100"
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x="-200" y="-200" z="300" />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale="150"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

// A labelled metric bar used by the Compare view. Width is normalized to the
// largest value in its column so regions can be eyeballed against each other.
// `label` is shown only below `md`, where the column headers are hidden and the
// row is stacked into a card.
const CompareBar: React.FC<{ value: number; max: number; display: string; label?: string }> = ({
  value,
  max,
  display,
  label,
}) => (
  <div>
    {label && (
      <span className="md:hidden block text-[10px] font-bold uppercase tracking-wider text-[#1d252d]/40 mb-0.5">
        {label}
      </span>
    )}
    <span className="text-sm font-black text-[#1d252d]">{display}</span>
    <div className="mt-1 h-2.5 w-full overflow-hidden rounded bg-[#1d252d]/5">
      <div
        className="h-full rounded"
        style={{
          width: `${Math.max(2, (value / max) * 100)}%`,
          background: "linear-gradient(90deg, #e93037 0%, #ff8a5c 100%)",
        }}
      />
    </div>
  </div>
);

// A small circular "i" button that opens a short plain-language explanation of how
// a metric is calculated. Click-triggered (works on touch) via the shared popover;
// content is portalled so it isn't clipped by the panel's overflow.
const InfoButton: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={`How ${label} is calculated`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#1d252d]/30 text-[9px] font-black italic leading-none text-[#1d252d]/50 transition-colors hover:border-[#e93037] hover:text-[#e93037] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50"
      >
        i
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      collisionPadding={12}
      className="w-60 p-3 text-[11px] font-medium leading-relaxed text-[#1d252d]/80"
    >
      <p className="mb-1 text-xs font-black text-[#1d252d]">{label}</p>
      {children}
    </PopoverContent>
  </Popover>
);


// --- MAIN DASHBOARD COMPONENT ---

export function CRMDashboard() {
  const [events, setEvents] = useState<ScoredEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mock, setMock] = useState(false)

  const [view, setView] = useState<"overview" | "compare">("overview")
  const [compareBy, setCompareBy] = useState<"city" | "country">("city")
  const [weights, setWeights] = useState({ newUsers: 40, connections: 30, simulations: 30 })
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  // Refetch (debounced) whenever weights/filters change.
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({
        wU: String(weights.newUsers),
        wC: String(weights.connections),
        wS: String(weights.simulations),
      })
      if (from) p.set("from", from)
      if (to) p.set("to", to)

      setLoading(true)
      fetch(`/api/events?${p.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.error) throw new Error(d.error)
          setEvents(d.events)
          setMock(Boolean(d.mock))
          setError(null)
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    }, 200)
    return () => clearTimeout(t)
  }, [weights, from, to])

  // Country-level aggregation drives the map, the TOP REGION card, and drill-in.
  const regions = useMemo(() => aggregateRegions(events), [events])
  // City-level aggregation lets a strong city (e.g. Munich) rank on its own
  // instead of being folded into its country.
  const cityRegions = useMemo(
    () => aggregateRegions(events, (e) => e.city || e.country || "Unknown"),
    [events]
  )
  const topRegion = regions[0]

  // Which granularity the Location Rankings view ranks by.
  const compareSource = compareBy === "city" ? cityRegions : regions

  // Ranking rows (ranked best -> worst, same order as the source aggregation).
  const compareRows = useMemo(
    () =>
      compareSource.map((r) => ({
        region: r.region,
        country: r.events[0]?.country ?? "",
        tier: r.tier,
        roi: r.roi,
        eventCount: r.eventCount,
        newUsers: r.totalNewUsers,
        avgConnections: r.totalNewUsers > 0 ? r.totalConnections / r.totalNewUsers : 0,
        avgSimulations: r.totalNewUsers > 0 ? r.totalSimulations / r.totalNewUsers : 0,
      })),
    [compareSource]
  )

  // Column maxima for bar normalization (guard against divide-by-zero).
  const compareMax = useMemo(
    () => ({
      roi: Math.max(1, ...compareRows.map((r) => r.roi)),
      newUsers: Math.max(1, ...compareRows.map((r) => r.newUsers)),
      avgConnections: Math.max(0.0001, ...compareRows.map((r) => r.avgConnections)),
      avgSimulations: Math.max(0.0001, ...compareRows.map((r) => r.avgSimulations)),
    }),
    [compareRows]
  )

  const totalNewUsers = events.reduce((s, e) => s + e.new_users, 0)
  const avgRoi = events.length
    ? Math.round(events.reduce((s, e) => s + e.roi, 0) / events.length)
    : 0

  const selectedEvent = events.find((e) => e.event_id === selectedEventId) ?? null
  // Resolve against both granularities so a clicked city row OR a clicked country
  // polygon both find their aggregation.
  const selectedRegionData = selectedRegion
    ? [...regions, ...cityRegions].find((r) => r.region === selectedRegion) ?? null
    : null

  const avgNewUsersPerEvent = events.length ? Math.round(totalNewUsers / events.length) : 0

  const statCards = [
    {
      label: "EVENTS TRACKED",
      value: String(events.length),
      sub: `across ${regions.length} region${regions.length === 1 ? "" : "s"}`,
    },
    {
      label: "NEW USERS ACQUIRED",
      value: totalNewUsers.toLocaleString(),
      sub: `~${avgNewUsersPerEvent.toLocaleString()} per event`,
    },
    { label: "AVERAGE EVENT ROI", value: String(avgRoi), sub: "0–100 composite" },
    {
      label: "TOP REGION",
      value: topRegion?.region ?? "—",
      sub: topRegion ? `ROI ${topRegion.roi}` : "no data yet",
    },
  ]

  const weightRows = [
    { key: "newUsers" as const, label: "New users" },
    { key: "connections" as const, label: "Connections" },
    { key: "simulations" as const, label: "Simulations" },
  ]

  // The engine normalizes weights to sum to 1 (see normalizeWeights in lib/weconnect/roi.ts),
  // so the *effective* weight is each slider's share of the total — that's what we display.
  const weightSum = weights.newUsers + weights.connections + weights.simulations
  const effectivePct = (v: number) => (weightSum > 0 ? Math.round((v / weightSum) * 100) : 0)

  return (
    <div className={`min-h-screen relative overflow-hidden bg-[#ffffff] ${inter.className} selection:bg-[#e93037]/20`}>

      {/* Liquid Glass SVG Definitions */}
      <GlassFilter />

      {/* Background Texture Blended with White (vendored locally — no external request) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale opacity-[0.04]"
        style={{
          backgroundImage: `url('/images/glass-texture.jpg')`,
        }}
      />

      {/* Subtle Red Brand Accent in Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#e93037] rounded-full filter blur-[150px] opacity-[0.06] pointer-events-none" />

      {/* Subtle Dark Grey Accent in Background */}
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1d252d] rounded-full filter blur-[150px] opacity-[0.04] pointer-events-none" />

      {/* Main Layout — fixed full-height "app" feel on lg+, natural scrolling below. */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 min-h-screen lg:h-screen">

        {/* Header */}
        <GlassEffect className="rounded-3xl px-6 py-4">
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center w-full">
            <div>
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-[#e93037]">WE</span>
                <span className="text-[#1d252d]">connect</span>
                <span className="text-[#1d252d]/70 font-bold"> · Event ROI</span>
              </h1>
              <p className="text-[#1d252d]/60 text-sm font-medium">Würth Electronics student-connection analytics</p>
            </div>

            <div role="group" aria-label="Dashboard view" className="self-center sm:justify-self-center flex items-center gap-1 rounded-xl border border-[#1d252d]/15 p-1 shrink-0">
              <button
                onClick={() => setView("overview")}
                aria-pressed={view === "overview"}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50 ${
                  view === "overview"
                    ? "bg-[#e93037] text-white"
                    : "text-[#1d252d] hover:bg-[#e93037]/10 hover:text-[#e93037]"
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setView("compare")}
                aria-pressed={view === "compare"}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50 ${
                  view === "compare"
                    ? "bg-[#e93037] text-white"
                    : "text-[#1d252d] hover:bg-[#e93037]/10 hover:text-[#e93037]"
                }`}
              >
                Location Rankings
              </button>
            </div>

            {mock && (
              <div className="self-center sm:justify-self-end px-4 py-1.5 rounded-full bg-[#e93037]/10 text-[#e93037] text-sm font-bold text-center sm:text-right">
                Demo data (no Supabase) — synthesized engagement
              </div>
            )}
          </div>
        </GlassEffect>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, index) => (
            <GlassEffect key={index} className="rounded-2xl px-4 py-3">
              <p className="text-[#1d252d]/60 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-[#1d252d] mt-1">{stat.value}</p>
              {stat.sub && <p className="text-[11px] font-medium text-[#1d252d]/50 mt-0.5">{stat.sub}</p>}
            </GlassEffect>
          ))}
        </div>

        {/* Bottom: Overview (detail + map + controls) or Compare (region table) */}
        {view === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 min-h-0">

          {/* Left detail panel */}
          <GlassEffect className="lg:col-span-3 rounded-3xl">
            <div className="p-6 overflow-y-auto">
              {selectedEvent ? (
                <div>
                  <button
                    onClick={() => setSelectedEventId(null)}
                    className="mb-3 rounded text-sm font-semibold text-[#1d252d]/60 hover:text-[#e93037] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50"
                  >
                    ← Back
                  </button>

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-[#1d252d]">{selectedEvent.name}</h3>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold shrink-0"
                      style={{ backgroundColor: `${TIER_COLOR[selectedEvent.tier]}22`, color: TIER_COLOR[selectedEvent.tier] }}
                      title={TIER_LABEL[selectedEvent.tier]}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_COLOR[selectedEvent.tier] }} />
                      ROI {selectedEvent.roi}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1d252d]/50 mt-0.5">
                    {selectedEvent.city}, {selectedEvent.country}
                    {selectedEvent.start_date ? ` · ${selectedEvent.start_date}` : ""}
                  </p>
                  {selectedEvent.lowData && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e93037]/10 px-2 py-0.5 text-xs font-bold text-[#e93037] mt-2">
                      ⚠ Low data — {Math.round(selectedEvent.confidence * 100)}% confidence
                    </span>
                  )}

                  <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { label: "New users", value: String(selectedEvent.new_users), hint: "joined via this event" },
                          { label: "Avg connections", value: fmt(selectedEvent.avg_connections), hint: "per attendee" },
                          {
                            label: "Avg simulations",
                            value: fmt(selectedEvent.avg_simulations),
                            hint: "per attendee",
                            info: "Total simulations run by attendees who joined via this event, divided by the number of new users. Higher means each attendee engaged more deeply with the platform.",
                          },
                          {
                            label: "Cost-adj. ROI",
                            value: selectedEvent.valuePerEuro != null ? String(selectedEvent.valuePerEuro) : "—",
                            hint: selectedEvent.cost != null ? `value / ${fmtEuro(selectedEvent.cost)}` : "no cost set",
                            info: "A “value per euro” figure: (new users + total connections + total simulations) ÷ the event’s cost. Higher means more engagement generated per euro spent. Shows “—” when no cost is recorded.",
                          },
                        ] as { label: string; value: string; hint: string; info?: string }[]).map((m) => (
                          <div key={m.label} className="rounded-xl border border-[#1d252d]/10 bg-[#1d252d]/[0.02] p-3">
                            <div className="flex items-center gap-1 text-xs font-medium text-[#1d252d]/50">
                              <span>{m.label}</span>
                              {m.info && <InfoButton label={m.label}>{m.info}</InfoButton>}
                            </div>
                            <div className="mt-0.5 text-xl font-black text-[#1d252d]">{m.value}</div>
                            <div className="text-[11px] font-medium text-[#1d252d]/40">{m.hint}</div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-[#1d252d]/10 bg-[#1d252d]/[0.02] p-4">
                        <div className="flex items-center gap-1 mb-3">
                          <h4 className="text-sm font-black text-[#1d252d]">Engagement funnel</h4>
                          <InfoButton label="Engagement funnel">
                            Each step shows how many of the people from the step above continued to the next action. The percentage is this step ÷ the step above it (e.g. of everyone who joined, how many went on to connect). The bar length shows the share of all signups.
                          </InfoButton>
                        </div>
                        <div className="space-y-2">
                          {buildFunnel(selectedEvent).map((s, i) => {
                            // Funnel is a fixed 3-step sequence; name the previous step in plain
                            // English instead of the jargony "of prev".
                            const convPhrase = ["", "of those who joined", "of those who connected"]
                            return (
                            <div key={s.label}>
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="font-medium text-[#1d252d]/70">{s.label}</span>
                                <span className="text-[#1d252d]/50">
                                  <span className="font-bold text-[#1d252d]">{s.value}</span>
                                  {i > 0 && <span className="ml-1">({Math.round(s.conversion * 100)}% {convPhrase[i] ?? "of the previous step"})</span>}
                                </span>
                              </div>
                              <div className="mt-1 h-3 w-full overflow-hidden rounded bg-[#1d252d]/5">
                                <div
                                  className="h-full rounded transition-all"
                                  style={{
                                    width: `${Math.max(2, s.ofSignups * 100)}%`,
                                    background: "linear-gradient(90deg, #e93037 0%, #ff8a5c 100%)",
                                    opacity: 1 - i * 0.22,
                                  }}
                                />
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      </div>
                  </div>
                </div>
              ) : selectedRegionData ? (
                <div>
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className="mb-3 rounded text-sm font-semibold text-[#1d252d]/60 hover:text-[#e93037] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50"
                  >
                    ← Back
                  </button>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-[#1d252d]">{selectedRegionData.region}</h3>
                      <p className="text-xs font-medium text-[#1d252d]/50 mt-0.5">
                        {selectedRegionData.eventCount} event{selectedRegionData.eventCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold shrink-0"
                      style={{ backgroundColor: `${TIER_COLOR[selectedRegionData.tier]}22`, color: TIER_COLOR[selectedRegionData.tier] }}
                      title={TIER_LABEL[selectedRegionData.tier]}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_COLOR[selectedRegionData.tier] }} />
                      ROI {selectedRegionData.roi}
                    </span>
                  </div>
                  {selectedRegionData.lowData && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e93037]/10 px-2 py-0.5 text-xs font-bold text-[#e93037] mt-2">
                      ⚠ Low data — {Math.round(selectedRegionData.confidence * 100)}% confidence
                    </span>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      { label: "New users", value: selectedRegionData.totalNewUsers.toLocaleString() },
                      { label: "Avg connections", value: fmt(selectedRegionData.totalNewUsers > 0 ? selectedRegionData.totalConnections / selectedRegionData.totalNewUsers : 0) },
                      { label: "Avg simulations", value: fmt(selectedRegionData.totalNewUsers > 0 ? selectedRegionData.totalSimulations / selectedRegionData.totalNewUsers : 0) },
                      { label: "Total simulations", value: selectedRegionData.totalSimulations.toLocaleString() },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl border border-[#1d252d]/10 bg-[#1d252d]/[0.02] p-3">
                        <div className="text-xs font-medium text-[#1d252d]/50">{m.label}</div>
                        <div className="mt-0.5 text-xl font-black text-[#1d252d]">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Events in this region — always shown */}
                  <div className="mt-6">
                    <h4 className="text-sm font-black text-[#1d252d] mb-2">Events in {selectedRegionData.region}</h4>
                    <div className="space-y-1">
                      {selectedRegionData.events.map((event, index) => (
                        <button
                          key={event.event_id}
                          onClick={() => setSelectedEventId(event.event_id)}
                          aria-label={`${event.name}, ${event.city}, ${event.country} — ROI ${event.roi}`}
                          className="flex w-full items-center gap-3 py-2 px-2 rounded-xl text-left transition-colors hover:bg-[#e93037]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50"
                        >
                          <span className="text-sm font-bold text-[#1d252d]/40 w-4 text-right shrink-0">{index + 1}</span>
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: TIER_COLOR[event.tier] }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#1d252d] truncate" title={event.name}>{event.name}</p>
                            <p className="text-xs font-medium text-[#1d252d]/50 truncate">{event.city}, {event.country}</p>
                          </div>
                          <span className="text-sm font-black text-[#1d252d] shrink-0">{event.roi}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-full py-12">
                  <h3 className="text-base font-black text-[#1d252d]">No selection</h3>
                  <p className="text-sm font-medium text-[#1d252d]/50 mt-1">
                    Select an event pin or a country on the map to see its analytics here.
                  </p>
                </div>
              )}
            </div>
          </GlassEffect>

          {/* Map Area (centered) */}
          <GlassEffect className="lg:col-span-6 rounded-3xl min-h-[420px] lg:min-h-0">
            <div className="relative flex-1 min-h-0 m-4 rounded-2xl bg-[#1d252d]/[0.02] border border-[#1d252d]/5 overflow-hidden">
              {/* Filters overlay (top-left of the map) */}
              <div className="absolute top-3 left-3 z-[1000]">
                <MapFilters
                  from={from}
                  to={to}
                  setFrom={setFrom}
                  setTo={setTo}
                />
              </div>

              {error && (
                <div className="absolute inset-x-0 bottom-0 z-[1000] bg-[#e93037]/90 px-4 py-2 text-sm font-medium text-white">
                  {error}
                </div>
              )}
              <EuropeMap
                events={events}
                regions={regions}
                selectedEventId={selectedEventId}
                onSelectEvent={(id) => {
                  setSelectedEventId(id)
                  setSelectedRegion(null)
                }}
                onSelectRegion={(name) => {
                  setSelectedRegion(name)
                  setSelectedEventId(null)
                }}
              />
            </div>
          </GlassEffect>

          {/* Right controls: ROI weighting + leaderboard */}
          <GlassEffect className="lg:col-span-3 rounded-3xl">
            <div className="p-6 space-y-8 overflow-y-auto">

              {/* ROI weighting */}
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="text-base font-black text-[#1d252d]">ROI weighting</h3>
                  <InfoButton label="ROI weighting">
                    Sets how much each engagement signal (new users, connections, simulations) counts toward an event&apos;s 0–100 ROI score. The three weights are normalized to total 100%, so raising one lowers the others&apos; share. Changes re-score and re-rank every event live.
                  </InfoButton>
                </div>
                <p className="text-[11px] font-medium text-[#1d252d]/50 mt-1 mb-4">
                  Shown as each metric&apos;s share of the total — they don&apos;t need to add up to 100%.
                </p>
                <div className="space-y-5">
                  {weightRows.map((row) => {
                    const pct = effectivePct(weights[row.key])
                    return (
                    <div key={row.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor={`weight-${row.key}`} className="text-sm font-semibold text-[#1d252d]/80">{row.label}</label>
                        <span className="text-sm font-bold text-[#1d252d]">{pct}%</span>
                      </div>
                      <input
                        id={`weight-${row.key}`}
                        type="range"
                        min={0}
                        max={100}
                        value={weights[row.key]}
                        onChange={(e) =>
                          setWeights((w) => ({ ...w, [row.key]: Number(e.target.value) }))
                        }
                        aria-label={`${row.label} ROI weight`}
                        aria-valuetext={`${pct}% of total`}
                        className="w-full h-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50 rounded"
                        style={{ accentColor: "#e93037" }}
                      />
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* Event leaderboard */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <h3 className="text-base font-black text-[#1d252d]">Event leaderboard</h3>
                    <InfoButton label="Event leaderboard">
                      Every tracked event ranked by its ROI score (highest first) using the weights above. Click an event to see its full breakdown.
                    </InfoButton>
                  </div>
                  <span className="text-xs font-medium text-[#1d252d]/50" aria-live="polite">
                    {loading ? "Updating…" : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  {events.map((event, index) => (
                    <button
                      key={event.event_id}
                      onClick={() => {
                        setSelectedEventId(event.event_id)
                        setSelectedRegion(null)
                      }}
                      aria-label={`${event.name}, ${event.city}, ${event.country} — ROI ${event.roi}`}
                      aria-pressed={selectedEventId === event.event_id}
                      className={`flex w-full items-center gap-3 py-2.5 px-2 rounded-xl text-left transition-colors hover:bg-[#e93037]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50 ${
                        selectedEventId === event.event_id ? "bg-[#e93037]/10" : ""
                      }`}
                    >
                      <span className="text-sm font-bold text-[#1d252d]/40 w-4 text-right shrink-0">{index + 1}</span>
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: TIER_COLOR[event.tier] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1d252d] truncate" title={event.name}>{event.name}</p>
                        <p className="text-xs font-medium text-[#1d252d]/50 truncate">{event.city}, {event.country}</p>
                      </div>
                      <span className="text-sm font-black text-[#1d252d] shrink-0">{event.roi}</span>
                    </button>
                  ))}
                  {!loading && events.length === 0 && (
                    <p className="text-sm font-medium text-[#1d252d]/50 py-2">No events match the current filters.</p>
                  )}
                </div>
              </div>

            </div>
          </GlassEffect>
        </div>
        ) : (
          <GlassEffect className="rounded-3xl flex-1 min-h-0">
            <div className="p-6 overflow-y-auto h-full">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-black text-[#1d252d]">Location rankings</h3>
                  <span className="text-xs font-medium text-[#1d252d]/50">
                    {compareRows.length}{" "}
                    {compareRows.length === 1
                      ? compareBy === "city" ? "city" : "country"
                      : compareBy === "city" ? "cities" : "countries"}{" "}
                    · ranked by ROI · click to drill in
                  </span>
                </div>
                <div role="group" aria-label="Rank by granularity" className="flex items-center gap-0.5 rounded-lg border border-[#1d252d]/15 p-0.5 shrink-0">
                  {(["city", "country"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setCompareBy(g)}
                      aria-pressed={compareBy === g}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50 ${
                        compareBy === g
                          ? "bg-[#e93037] text-white"
                          : "text-[#1d252d] hover:bg-[#e93037]/10 hover:text-[#e93037]"
                      }`}
                    >
                      By {g}
                    </button>
                  ))}
                </div>
              </div>

              {compareRows.length === 0 ? (
                <p className="text-sm font-medium text-[#1d252d]/50 py-8 text-center">
                  No {compareBy === "city" ? "cities" : "countries"} match the current filters.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Column headers (md+ only; rows stack into cards below md) */}
                  <div className="hidden md:grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#1d252d]/40">
                    <span>Location</span>
                    <span>New users</span>
                    <span>Avg connections</span>
                    <span>Avg simulations</span>
                    <span>ROI</span>
                  </div>

                  {compareRows.map((r) => (
                    <button
                      key={r.region}
                      onClick={() => {
                        setSelectedRegion(r.region)
                        setSelectedEventId(null)
                        setView("overview")
                      }}
                      aria-label={`${r.region}${compareBy === "city" && r.country ? `, ${r.country}` : ""}, ${r.eventCount} events, ROI ${r.roi} — view details`}
                      className="grid grid-cols-2 md:grid-cols-[180px_1fr_1fr_1fr_1fr] gap-3 md:gap-4 md:items-center w-full rounded-2xl border border-[#1d252d]/10 bg-[#1d252d]/[0.02] px-3 py-3 text-left transition-colors hover:bg-[#e93037]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e93037]/50"
                    >
                      <div className="min-w-0 col-span-2 md:col-span-1">
                        <p className="text-sm font-black text-[#1d252d] truncate" title={r.region}>{r.region}</p>
                        <p className="text-[11px] font-medium text-[#1d252d]/50 truncate">
                          {compareBy === "city" && r.country ? `${r.country} · ` : ""}
                          {r.eventCount} event{r.eventCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <CompareBar label="New users" value={r.newUsers} max={compareMax.newUsers} display={r.newUsers.toLocaleString()} />
                      <CompareBar label="Avg connections" value={r.avgConnections} max={compareMax.avgConnections} display={fmt(r.avgConnections)} />
                      <CompareBar label="Avg simulations" value={r.avgSimulations} max={compareMax.avgSimulations} display={fmt(r.avgSimulations)} />
                      <div>
                        <span className="md:hidden block text-[10px] font-bold uppercase tracking-wider text-[#1d252d]/40 mb-0.5">
                          ROI
                        </span>
                        <span className="text-sm font-black" style={{ color: TIER_COLOR[r.tier] }}>
                          {r.roi}
                        </span>
                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded bg-[#1d252d]/5">
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${Math.max(2, (r.roi / compareMax.roi) * 100)}%`,
                              background: TIER_COLOR[r.tier],
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GlassEffect>
        )}
      </div>
    </div>
  )
}

"use client"

import React, { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Inter } from "next/font/google"
import { aggregateRegions, buildFunnel } from "@/lib/weconnect/roi"
import { TIER_COLOR, TIER_LABEL, fmt, fmtEuro } from "@/lib/weconnect/format"
import type { ScoredEvent } from "@/lib/weconnect/types"
import MapFilters from "./MapFilters"

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


// --- MAIN DASHBOARD COMPONENT ---

export function CRMDashboard() {
  const [events, setEvents] = useState<ScoredEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mock, setMock] = useState(false)

  const [weights, setWeights] = useState({ newUsers: 40, connections: 30, simulations: 30 })
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [generatedRegion, setGeneratedRegion] = useState<string | null>(null)

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

  const regions = useMemo(() => aggregateRegions(events), [events])
  const topRegion = regions[0]

  const totalNewUsers = events.reduce((s, e) => s + e.new_users, 0)
  const avgRoi = events.length
    ? Math.round(events.reduce((s, e) => s + e.roi, 0) / events.length)
    : 0

  const selectedEvent = events.find((e) => e.event_id === selectedEventId) ?? null
  const selectedRegionData = selectedRegion
    ? regions.find((r) => r.region === selectedRegion) ?? null
    : null

  const statCards = [
    { label: "EVENTS TRACKED", value: String(events.length), sub: "" },
    { label: "NEW USERS ACQUIRED", value: totalNewUsers.toLocaleString(), sub: "" },
    { label: "AVERAGE EVENT ROI", value: String(avgRoi), sub: "0–100 composite" },
    {
      label: "TOP REGION",
      value: topRegion?.region ?? "—",
      sub: topRegion ? `ROI ${topRegion.roi}` : "",
    },
  ]

  const weightRows = [
    { key: "newUsers" as const, label: "New users" },
    { key: "connections" as const, label: "Connections" },
    { key: "simulations" as const, label: "Simulations" },
  ]

  return (
    <div className={`min-h-screen relative overflow-hidden bg-[#ffffff] ${inter.className} selection:bg-[#e93037]/20`}>

      {/* Liquid Glass SVG Definitions */}
      <GlassFilter />

      {/* Background Texture Blended with White */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale opacity-[0.04]"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fractal%20Glass%20-%204.jpg-8QPt1A02QgjJIeTqwEYV5thwZXXEGT.jpeg')`,
        }}
      />

      {/* Subtle Red Brand Accent in Background */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#e93037] rounded-full filter blur-[150px] opacity-[0.06] pointer-events-none" />

      {/* Subtle Dark Grey Accent in Background */}
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1d252d] rounded-full filter blur-[150px] opacity-[0.04] pointer-events-none" />

      {/* Main Layout */}
      <div className="relative z-10 p-6 flex flex-col gap-6 h-screen">

        {/* Header */}
        <GlassEffect className="rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between w-full gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight">
                <span className="text-[#e93037]">WE</span>
                <span className="text-[#1d252d]">connect</span>
                <span className="text-[#1d252d]/70 font-bold"> · Event ROI</span>
              </h1>
              <p className="text-[#1d252d]/60 text-sm font-medium">Würth Electronics student-connection analytics</p>
            </div>

            {mock && (
              <div className="px-4 py-1.5 rounded-full bg-[#e93037]/10 text-[#e93037] text-sm font-bold whitespace-nowrap">
                Demo data (no Supabase) — synthesized engagement
              </div>
            )}

            <div className="flex items-center gap-0.5 rounded-lg border border-[#1d252d]/15 p-0.5 shrink-0">
              <button className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#1d252d] hover:bg-[#e93037]/10 hover:text-[#e93037] transition-colors">
                Compare
              </button>
              <button className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#1d252d] hover:bg-[#e93037]/10 hover:text-[#e93037] transition-colors">
                Overview
              </button>
            </div>
          </div>
        </GlassEffect>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <GlassEffect key={index} className="rounded-2xl px-4 py-3">
              <p className="text-[#1d252d]/60 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-[#1d252d] mt-1">{stat.value}</p>
              {stat.sub && <p className="text-[11px] font-medium text-[#1d252d]/50 mt-0.5">{stat.sub}</p>}
            </GlassEffect>
          ))}
        </div>

        {/* Bottom: Left detail + centered Map + Right controls */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

          {/* Left detail panel */}
          <GlassEffect className="col-span-3 rounded-3xl">
            <div className="p-6 overflow-y-auto">
              {selectedEvent ? (
                <div>
                  <button
                    onClick={() => setSelectedEventId(null)}
                    className="mb-3 text-sm font-semibold text-[#1d252d]/60 hover:text-[#e93037] transition-colors"
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

                  {generatedId !== selectedEvent.event_id ? (
                    <button
                      onClick={() => setGeneratedId(selectedEvent.event_id)}
                      className="w-full mt-4 rounded-xl bg-[#e93037] px-4 py-2.5 font-bold text-white shadow-md transition-all hover:bg-[#cc2a30] hover:scale-[1.02]"
                    >
                      Generate event analytics
                    </button>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "New users", value: String(selectedEvent.new_users), hint: "joined via this event" },
                          { label: "Avg connections", value: fmt(selectedEvent.avg_connections), hint: "per attendee" },
                          { label: "Avg simulations", value: fmt(selectedEvent.avg_simulations), hint: "per attendee" },
                          {
                            label: "Cost-adj. ROI",
                            value: selectedEvent.valuePerEuro != null ? String(selectedEvent.valuePerEuro) : "—",
                            hint: selectedEvent.cost != null ? `value / ${fmtEuro(selectedEvent.cost)}` : "no cost set",
                          },
                        ].map((m) => (
                          <div key={m.label} className="rounded-xl border border-[#1d252d]/10 bg-[#1d252d]/[0.02] p-3">
                            <div className="text-xs font-medium text-[#1d252d]/50">{m.label}</div>
                            <div className="mt-0.5 text-xl font-black text-[#1d252d]">{m.value}</div>
                            <div className="text-[11px] font-medium text-[#1d252d]/40">{m.hint}</div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-[#1d252d]/10 bg-[#1d252d]/[0.02] p-4">
                        <h4 className="text-sm font-black text-[#1d252d] mb-3">Engagement funnel</h4>
                        <div className="space-y-2">
                          {buildFunnel(selectedEvent).map((s, i) => (
                            <div key={s.label}>
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="font-medium text-[#1d252d]/70">{s.label}</span>
                                <span className="text-[#1d252d]/50">
                                  <span className="font-bold text-[#1d252d]">{s.value}</span>
                                  {i > 0 && <span className="ml-1">({Math.round(s.conversion * 100)}% of prev)</span>}
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
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedRegionData ? (
                <div>
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className="mb-3 text-sm font-semibold text-[#1d252d]/60 hover:text-[#e93037] transition-colors"
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

                  {generatedRegion !== selectedRegionData.region ? (
                    <button
                      onClick={() => setGeneratedRegion(selectedRegionData.region)}
                      className="w-full mt-4 rounded-xl bg-[#e93037] px-4 py-2.5 font-bold text-white shadow-md transition-all hover:bg-[#cc2a30] hover:scale-[1.02]"
                    >
                      Generate region analytics
                    </button>
                  ) : (
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
                  )}

                  {/* Events in this region — always shown */}
                  <div className="mt-6">
                    <h4 className="text-sm font-black text-[#1d252d] mb-2">Events in {selectedRegionData.region}</h4>
                    <div className="space-y-1">
                      {selectedRegionData.events.map((event, index) => (
                        <button
                          key={event.event_id}
                          onClick={() => setSelectedEventId(event.event_id)}
                          className="flex w-full items-center gap-3 py-2 px-2 rounded-xl text-left transition-colors hover:bg-[#e93037]/5"
                        >
                          <span className="text-sm font-bold text-[#1d252d]/40 w-4 text-right shrink-0">{index + 1}</span>
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: TIER_COLOR[event.tier] }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#1d252d] truncate">{event.name}</p>
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
          <GlassEffect className="col-span-6 rounded-3xl">
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
          <GlassEffect className="col-span-3 rounded-3xl">
            <div className="p-6 space-y-8 overflow-y-auto">

              {/* ROI weighting */}
              <div>
                <h3 className="text-base font-black text-[#1d252d] mb-4">ROI weighting</h3>
                <div className="space-y-5">
                  {weightRows.map((row) => (
                    <div key={row.key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-[#1d252d]/80">{row.label}</label>
                        <span className="text-sm font-bold text-[#1d252d]">{weights[row.key]}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={weights[row.key]}
                        onChange={(e) =>
                          setWeights((w) => ({ ...w, [row.key]: Number(e.target.value) }))
                        }
                        className="w-full h-2 cursor-pointer"
                        style={{ accentColor: "#e93037" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Event leaderboard */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black text-[#1d252d]">Event leaderboard</h3>
                  {loading && <span className="text-xs font-medium text-[#1d252d]/50">Updating…</span>}
                </div>
                <div className="space-y-1">
                  {events.map((event, index) => (
                    <button
                      key={event.event_id}
                      onClick={() => {
                        setSelectedEventId(event.event_id)
                        setSelectedRegion(null)
                      }}
                      className={`flex w-full items-center gap-3 py-2.5 px-2 rounded-xl text-left transition-colors hover:bg-[#e93037]/5 ${
                        selectedEventId === event.event_id ? "bg-[#e93037]/10" : ""
                      }`}
                    >
                      <span className="text-sm font-bold text-[#1d252d]/40 w-4 text-right shrink-0">{index + 1}</span>
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: TIER_COLOR[event.tier] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1d252d] truncate">{event.name}</p>
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
      </div>
    </div>
  )
}

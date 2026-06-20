"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { ScoredEvent, RegionAnalytics } from "@/lib/types";
import { TIER_COLOR } from "@/lib/format";

// HTML pin rendered in Leaflet's markerPane, which sits above the region
// polygons — so clicking an event near a border always selects the event,
// not the country underneath it.
function eventIcon(event: ScoredEvent, selected: boolean): L.DivIcon {
  const size = selected ? 26 : 16 + Math.min(12, event.new_users / 12);
  const color = TIER_COLOR[event.tier];
  // Low-data events render hollow + dashed so their (dampened) ROI isn't read as solid.
  const border = event.lowData
    ? `2px dashed ${selected ? "#ffffff" : "rgba(255,255,255,0.85)"}`
    : `${selected ? 3 : 2}px solid ${selected ? "#ffffff" : "rgba(255,255,255,0.75)"}`;
  return L.divIcon({
    className: "we-event-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="
      display:block;width:${size}px;height:${size}px;border-radius:9999px;
      background:${event.lowData ? "transparent" : color};
      border:${border};
      box-shadow:0 0 0 1px rgba(0,0,0,0.4)${selected ? `,0 0 12px ${color}` : ""};
      cursor:pointer;"></span>`,
  });
}

// Public-domain world borders. Fetched at runtime so we don't bundle a large
// file; if it fails the markers (the core feature) still render.
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

interface Props {
  events: ScoredEvent[];
  regions: RegionAnalytics[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onSelectRegion: (region: string) => void;
}

function featureName(f: Feature): string {
  const p = (f.properties ?? {}) as Record<string, unknown>;
  return String(p.ADMIN ?? p.name ?? p.NAME ?? "");
}

export default function EuropeMap({
  events,
  regions,
  selectedEventId,
  onSelectEvent,
  onSelectRegion,
}: Props) {
  const [countries, setCountries] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let active = true;
    fetch(COUNTRIES_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => active && d && setCountries(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const regionByName = new Map(regions.map((r) => [r.region.toLowerCase(), r]));

  return (
    <MapContainer
      center={[25, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      worldCopyJump
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {countries && (
        <GeoJSON
          key={regions.map((r) => `${r.region}:${r.roi}`).join("|")}
          data={countries}
          style={(feature) => {
            const region = feature ? regionByName.get(featureName(feature).toLowerCase()) : undefined;
            if (!region) {
              return { fillOpacity: 0, color: "#3f3f46", weight: 0.5 };
            }
            return {
              fillColor: TIER_COLOR[region.tier],
              fillOpacity: 0.28,
              color: TIER_COLOR[region.tier],
              weight: 1,
            };
          }}
          onEachFeature={(feature, layer) => {
            const region = regionByName.get(featureName(feature).toLowerCase());
            if (region) {
              layer.bindTooltip(
                `${region.region}: ROI ${region.roi} · ${region.eventCount} events`,
                { sticky: true }
              );
              layer.on("click", () => onSelectRegion(region.region));
            }
          }}
        />
      )}

      {events
        .filter((e) => e.lat != null && e.lng != null)
        .map((e) => {
          const selected = e.event_id === selectedEventId;
          return (
            <Marker
              key={e.event_id}
              position={[e.lat as number, e.lng as number]}
              icon={eventIcon(e, selected)}
              zIndexOffset={selected ? 1000 : 0}
              eventHandlers={{ click: () => onSelectEvent(e.event_id) }}
            >
              <Tooltip>
                <span className="font-semibold">{e.name}</span>
                <br />
                {e.city}, {e.country} · ROI {e.roi}
              </Tooltip>
            </Marker>
          );
        })}
    </MapContainer>
  );
}

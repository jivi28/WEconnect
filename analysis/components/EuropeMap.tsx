"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  GeoJSON,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection } from "geojson";
import type { ScoredEvent, RegionAnalytics } from "@/lib/weconnect/types";
import { TIER_COLOR } from "@/lib/weconnect/format";

// HTML pin rendered in Leaflet's markerPane, which sits above the region
// polygons — so clicking an event near a border always selects the event,
// not the country underneath it.
function eventIcon(event: ScoredEvent, selected: boolean): L.DivIcon {
  const size = selected ? 26 : 16 + Math.min(12, event.new_users / 12);
  const color = TIER_COLOR[event.tier];
  // Low-data events render hollow + dashed so their (dampened) ROI isn't read as solid.
  const border = event.lowData
    ? `2px dashed ${selected ? "#1d252d" : "rgba(29,37,45,0.6)"}`
    : `${selected ? 3 : 2}px solid ${selected ? "#1d252d" : "rgba(255,255,255,0.9)"}`;
  const label = `${event.name} — ${event.city ?? ""}, ${event.country ?? ""} · ROI ${event.roi}`;
  return L.divIcon({
    className: "we-event-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span role="button" tabindex="0" aria-label="${label.replace(/"/g, "&quot;")}" title="${label.replace(/"/g, "&quot;")}" style="
      display:block;width:${size}px;height:${size}px;border-radius:9999px;
      background:${event.lowData ? "transparent" : color};
      border:${border};
      box-shadow:0 0 0 1px rgba(0,0,0,0.25)${selected ? `,0 0 12px ${color}` : ""};
      cursor:pointer;"></span>`,
  });
}

// Public-domain world borders (Natural Earth 110m), vendored under /public so the
// map works offline and on locked-down networks — no external request. Fetched at
// runtime (not bundled) to keep the JS payload small; if it fails the markers (the
// core feature) still render.
const COUNTRIES_URL = "/geo/countries.geo.json";

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
      center={[48, 12]}
      zoom={4}
      minZoom={2}
      maxZoom={10}
      worldCopyJump
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {countries && (
        <GeoJSON
          key={regions.map((r) => `${r.region}:${r.roi}`).join("|")}
          data={countries}
          style={(feature) => {
            const region = feature ? regionByName.get(featureName(feature).toLowerCase()) : undefined;
            if (!region) {
              return { fillOpacity: 0, color: "#d4d4d8", weight: 0.5 };
            }
            return {
              fillColor: TIER_COLOR[region.tier],
              fillOpacity: 0.35,
              color: TIER_COLOR[region.tier],
              weight: 1.5,
            };
          }}
          onEachFeature={(feature, layer) => {
            const region = regionByName.get(featureName(feature).toLowerCase());
            if (region) {
              const path = layer as L.Path;
              layer.bindTooltip(
                `${region.region}: ROI ${region.roi} · ${region.eventCount} events`,
                { sticky: true }
              );
              // Hover highlight so it's obvious the region is clickable.
              layer.on({
                mouseover: () => path.setStyle({ fillOpacity: 0.55, weight: 2.5 }),
                mouseout: () => path.setStyle({ fillOpacity: 0.35, weight: 1.5 }),
                click: () => onSelectRegion(region.region),
              });
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

import type {
  ComponentCategory,
  RelevantComponent,
  SimulationComponent,
  SimulationData,
  SimulationStep,
  WeComponent,
  WEComponent,
} from "@/lib/types";
import {
  ALL_COMPONENTS,
  COMPONENT_CATEGORIES,
} from "@/lib/simulation/weComponentData";

/**
 * The catalogue is the real-product set in lib/simulation/weComponentData.ts
 * (derived from the WEComponents/ folders + WE_PRODUCT_LOOKUP). Everything
 * below derives the simulation / relevance behaviour from that data.
 */

/** Public catalogue — what the component library can list. */
export const COMPONENTS: WeComponent[] = ALL_COMPONENTS;

/** All categories present in the generated catalogue. */
export const CATEGORIES = [...COMPONENT_CATEGORIES] as ComponentCategory[];

/** Curated example ideas surfaced as chips on the input screen. */
export const EXAMPLE_IDEAS = [
  "EMC filter",
  "USB data line protection",
  "Mains power supply",
  "DC-DC converter",
] as const;

/* ------------------------------------------------------------------ */
/* Relevance scoring (the boundary a real model-provider call replaces) */
/* ------------------------------------------------------------------ */

/** Words of the idea (deduped, length > 2) used for keyword overlap. */
function ideaWords(idea: string): string[] {
  return Array.from(
    new Set(
      idea
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2),
    ),
  );
}

/** Score a component by how many idea words appear in its searchable text. */
function scoreComponent(component: WEComponent, words: string[]): number {
  const haystack = `${component.name} ${component.category} ${
    component.subcategory ?? ""
  } ${component.shortDescription}`.toLowerCase();
  let score = 0;
  for (const word of words) {
    if (haystack.includes(word)) score += 1;
  }
  return score;
}

/**
 * Pick 6–8 components relevant to the idea by keyword overlap. When nothing
 * matches, fall back to a representative spread across subcategories so the
 * workspace always has a varied, sensible set.
 */
function pickRelevant(idea: string, count = 7): WEComponent[] {
  const words = ideaWords(idea);

  const scored = ALL_COMPONENTS.map((component) => ({
    component,
    score: scoreComponent(component, words),
  })).sort((a, b) => b.score - a.score);

  if (scored.some((s) => s.score > 0)) {
    return scored
      .filter((s) => s.score > 0)
      .slice(0, count)
      .map((s) => s.component);
  }

  // No keyword match → spread across subcategories (round-robin).
  const byGroup = new Map<string, WEComponent[]>();
  for (const component of ALL_COMPONENTS) {
    const key = component.subcategory ?? component.category;
    const bucket = byGroup.get(key) ?? [];
    bucket.push(component);
    byGroup.set(key, bucket);
  }
  const buckets = [...byGroup.values()];
  const spread: WEComponent[] = [];
  for (let round = 0; spread.length < count; round += 1) {
    let added = false;
    for (const bucket of buckets) {
      if (round < bucket.length) {
        spread.push(bucket[round]);
        added = true;
        if (spread.length === count) break;
      }
    }
    if (!added) break;
  }
  return spread;
}

/**
 * Mock "AI" relevance engine. Same input/output shape a future model API
 * call will take: an idea string in, scored components (with a reason) out.
 */
export function getRelevantComponents(idea: string): RelevantComponent[] {
  return pickRelevant(idea).map((component) => ({
    ...component,
    relevanceReason: component.hint,
  }));
}

/* ------------------------------------------------------------------ */
/* Guided puzzle data                                                 */
/* ------------------------------------------------------------------ */

/**
 * Logical assembly order for a process: power & protection first, then
 * filtering, then signal conditioning, then everything else (output). Lower
 * rank = earlier slot.
 */
const SUBCATEGORY_ORDER: Record<string, number> = {
  "Surge Protection": 1,
  "ESD Protection": 2,
  "Common Mode Chokes — Mains": 3,
  "Filter Chokes": 4,
  "Ferrites for PCB Assembly": 5,
  "Common Mode Chokes — Data Lines": 6,
  General: 7,
};

/** Concise slot label + icon (a key in PuzzleWorkspace's SLOT_ICONS) per subcategory. */
const SUBCATEGORY_SLOT: Record<string, { label: string; icon: string }> = {
  "Surge Protection": { label: "Surge protection", icon: "shield" },
  "ESD Protection": { label: "ESD protection", icon: "shield" },
  "Common Mode Chokes — Mains": { label: "Mains filtering", icon: "bolt" },
  "Filter Chokes": { label: "Filter choke", icon: "activity" },
  "Ferrites for PCB Assembly": { label: "Ferrite bead", icon: "filter" },
  "Common Mode Chokes — Data Lines": { label: "Data-line filter", icon: "filter" },
  General: { label: "Component", icon: "cpu" },
};

function rankOf(component: WEComponent): number {
  return SUBCATEGORY_ORDER[component.subcategory ?? "General"] ?? 7;
}

function slotOf(component: WEComponent): { label: string; icon: string } {
  return (
    SUBCATEGORY_SLOT[component.subcategory ?? "General"] ?? {
      label: "Component",
      icon: "cpu",
    }
  );
}

/** "emc filter" → "Emc Filter". */
function titleCase(idea: string): string {
  const trimmed = idea.trim();
  if (!trimmed) return "Your Product";
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Mock guided-flow data. This is the boundary a future AI call will replace:
 * idea text in, an ordered set of slots (each with the expected component) out.
 * Components are ordered power/protection → filtering → signal → output.
 */
export function getSimulationData(idea: string): SimulationData {
  const picked = pickRelevant(idea)
    .slice()
    .sort((a, b) => rankOf(a) - rankOf(b));

  const labelCounts = new Map<string, number>();
  const steps: SimulationStep[] = picked.map((component, index) => {
    const { label, icon } = slotOf(component);
    // Disambiguate repeated subcategory labels within the same set ("… 2").
    const seen = (labelCounts.get(label) ?? 0) + 1;
    labelCounts.set(label, seen);
    const slotLabel = seen > 1 ? `${label} ${seen}` : label;
    return {
      slotNumber: index + 1,
      slotLabel,
      slotIcon: icon,
      component: component as SimulationComponent,
    };
  });

  return {
    productName: titleCase(idea),
    steps,
    processSteps: [],
    illustrationPlan: {
      silhouette: "rounded",
      palette: "graphite",
      features: ["controls", "sensor"],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Free Build — generic, idea-agnostic compatibility                  */
/* ------------------------------------------------------------------ */

/**
 * In Free Build mode there is no target product. Each category exposes the
 * generic connection types it can interface with, and two parts "fit together"
 * if they share at least one — so a valid process can be assembled step by step
 * without knowing what it will become.
 */
const CONNECTION_TAGS: Record<string, string[]> = {
  "Power Management": ["power"],
  Transformers: ["power"],
  Inductors: ["power"],
  Capacitors: ["power", "signal"],
  "EMC Components": ["power", "signal", "ground"],
  Semiconductors: ["signal", "protect"],
  Protection: ["power", "signal", "protect"],
  Connectors: ["power", "signal"],
  Wireless: ["signal"],
  Sensors: ["signal"],
  LEDs: ["power", "signal"],
  Resistors: ["power", "signal"],
  Switches: ["power", "signal"],
  "Core Module": ["power", "signal"],
  Components: ["power", "signal", "ground"],
};

/** The connection types a category can interface with. */
export function connectionTags(category: ComponentCategory): string[] {
  return CONNECTION_TAGS[category] ?? ["power", "signal"];
}

/** Connection types two categories have in common (their valid interfaces). */
export function sharedConnections(
  a: ComponentCategory,
  b: ComponentCategory,
): string[] {
  const tagsB = new Set(connectionTags(b));
  return connectionTags(a).filter((t) => tagsB.has(t));
}

/** Free Build rule: two parts fit if they share at least one connection type. */
export function canConnect(a: ComponentCategory, b: ComponentCategory): boolean {
  return sharedConnections(a, b).length > 0;
}

/**
 * Auto-generates a connection label from the two endpoints' categories,
 * e.g. "Power →", "Filter →". Order-independent; the first matching role wins.
 */
export function connectionLabel(
  a: ComponentCategory,
  b: ComponentCategory,
): string {
  const cats = [a, b];
  const has = (c: ComponentCategory) => cats.includes(c);
  if (has("Power Management") || has("Inductors") || has("Transformers")) return "Power →";
  if (has("Sensors") || has("Wireless")) return "Signal →";
  if (has("EMC Components") || has("Capacitors")) return "Filter →";
  if (has("Connectors")) return "Bus →";
  if (has("Semiconductors") || has("Protection")) return "Protect →";
  return "Link →";
}

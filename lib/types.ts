/** High-level component families used for tagging + iconography. */
export type ComponentCategory =
  // Legacy curated catalogue families
  | "Power Management"
  | "Sensors"
  | "Core Module"
  // Families derived from the WEComponents/ catalogue
  | "Inductors"
  | "Capacitors"
  | "LEDs"
  | "Connectors"
  | "Protection"
  | "Transformers"
  | "EMC Components"
  | "Resistors"
  | "Wireless"
  | "Switches"
  | "Semiconductors"
  | "Components";

/** A Würth Elektronik component in the mock catalogue. */
export interface WeComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  /** Optional WE product family / sub-family (e.g. "ESD Protection"). */
  subcategory?: string;
  partNumber: string;
  shortDescription: string;
  /** Path to a static glTF model, when an interactive 3D view is available. */
  modelPath?: string;
  /** Flags a component that renders an interactive 3D viewer. */
  has3DModel?: boolean;
}

/**
 * A component as returned by the (mock) AI relevance engine for a given idea.
 * Adds a project-specific explanation of why the part fits.
 */
export interface RelevantComponent extends WeComponent {
  relevanceReason: string;
}

/** A catalogue part prepared for the guided puzzle experience. */
export interface SimulationComponent extends WeComponent {
  hint: string;
}

/**
 * A component in the WEComponents/ catalogue
 * (lib/simulation/weComponentData.ts). Carries the same fields the puzzle needs.
 */
export type WEComponent = SimulationComponent;

export interface SimulationStep {
  slotNumber: number;
  slotLabel: string;
  slotIcon: string;
  component: SimulationComponent;
}

export interface SimulationProcessStep {
  id: string;
  insertAfterComponent: number;
  title: string;
  explanation: string;
}

export interface ProductIllustrationPlan {
  silhouette: "rounded" | "wide" | "tall" | "circular" | "wearable" | "vehicle" | "panel";
  palette: "red" | "graphite" | "silver" | "blue" | "green";
  features: Array<"display" | "controls" | "vents" | "sensor" | "lighting">;
}

export interface SimulationData {
  productName: string;
  steps: SimulationStep[];
  processSteps: SimulationProcessStep[];
  illustrationPlan: ProductIllustrationPlan;
}

export interface AISelectionStep {
  slotNumber: number;
  slotLabel: string;
  slotIcon: string;
  componentId: string;
  whyItFits: string;
  learnerTip: string;
}

export interface AIProcessStep {
  insertAfterComponent: number;
  title: string;
  explanation: string;
}

export interface AIComponentSelection {
  canBuild: boolean;
  confidence: "high" | "medium" | "low";
  message: string | null;
  errorMessage: string | null;
  steps: AISelectionStep[];
  processSteps: AIProcessStep[];
  illustrationPlan: ProductIllustrationPlan;
}

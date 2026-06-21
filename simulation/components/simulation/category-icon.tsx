import {
  BatteryCharging,
  Boxes,
  CircuitBoard,
  Cpu,
  Lightbulb,
  Plug2,
  Radar,
  RadioTower,
  ShieldCheck,
  Spline,
  ToggleLeft,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ComponentCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ComponentCategory, LucideIcon> = {
  "Power Management": BatteryCharging,
  Inductors: Spline,
  Capacitors: Zap,
  LEDs: Lightbulb,
  Connectors: Plug2,
  Protection: ShieldCheck,
  Transformers: BatteryCharging,
  Sensors: Radar,
  "EMC Components": ShieldCheck,
  Resistors: CircuitBoard,
  Wireless: RadioTower,
  Switches: ToggleLeft,
  Semiconductors: Cpu,
  "Core Module": Boxes,
  Components: CircuitBoard,
};

export function getCategoryIcon(category: ComponentCategory): LucideIcon {
  return ICONS[category] ?? CircuitBoard;
}

/** Square, technical icon chip representing a component category. */
export function CategoryIcon({
  category,
  className,
  size = 16,
}: {
  category: ComponentCategory;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[category] ?? CircuitBoard;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-we)] border border-line bg-canvas text-we-red",
        className,
      )}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}

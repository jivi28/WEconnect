import type { Metadata } from "next";
import { Simulator } from "@/components/simulation/simulator";

export const metadata: Metadata = {
  title: "Innovation Simulator — Würth Elektronik",
  description:
    "Describe your project idea and get a drag-and-drop workspace pre-populated with the right Würth Elektronik components.",
};

export default function SimulationPage() {
  return <Simulator />;
}

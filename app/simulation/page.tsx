import type { Metadata } from "next";
import { Simulator } from "@/components/simulation/simulator";
import { AuthProvider } from "@/components/auth/auth-provider";
import { DevSignIn } from "@/components/auth/dev-sign-in";

export const metadata: Metadata = {
  title: "Innovation Simulator — Würth Elektronik",
  description:
    "Describe your project idea and get a drag-and-drop workspace pre-populated with the right Würth Elektronik components.",
};

export default function SimulationPage() {
  return (
    <AuthProvider>
      <Simulator />
      <DevSignIn />
    </AuthProvider>
  );
}

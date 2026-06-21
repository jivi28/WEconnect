import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Innovation Simulator — Würth Elektronik",
  description:
    "Describe your idea. We'll find the components. An AI-powered component simulation playground by Würth Elektronik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning: browser extensions (e.g. SwiftRead) inject
  // attributes on <html>/<body> before React hydrates, which would otherwise
  // trip a hydration mismatch.
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body suppressHydrationWarning className="min-h-full antialiased">{children}</body>
    </html>
  );
}

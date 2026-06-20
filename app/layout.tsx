import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "WEconnect — Event ROI Analysis",
  description:
    "Würth Electronics company dashboard for analyzing the ROI of student-connection events worldwide.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}

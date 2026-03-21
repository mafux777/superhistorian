import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Super Historian — Explore the Infinite Depth of History",
  description:
    "An AI-driven interactive history explorer. Drill into any era by time or geography, going infinitely deep into the fractal structure of human history.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

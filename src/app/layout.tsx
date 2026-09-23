import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKIM: 5 HOURS",
  description:
    "Become the akim of Astana. Five decisions, one budget, and a better city. A deterministic city strategy game.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

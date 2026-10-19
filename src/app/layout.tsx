import type { Metadata } from "next";
import "./globals.css";
import "@/styles/studio.css";
import "katex/dist/katex.min.css";
export const metadata: Metadata = {
  title: "Aptmark — Practice with purpose",
  description:
    "Free, adaptive SAT preparation with focused practice, clear explanations, and honest progress.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

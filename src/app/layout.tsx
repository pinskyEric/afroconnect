import palette from "@/config/palette.json";
import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { AppProvider } from "@/components/provider";
import { brand } from "@/config/brand";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: `${brand.name} — A world of real connections`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: brand.colors.primary,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tokens = Object.fromEntries([
    ...Object.entries(palette).map(([key, val]) => [`--${key}`, val]),
    ...Object.entries(brand.colors).map(([key, val]) => [`--${key}`, val]),
    ["--font-heading", brand.fonts.heading],
    ["--font-body", brand.fonts.body],
    ["--radius-sm", brand.radius.small],
    ["--radius-md", brand.radius.medium],
    ["--radius-lg", brand.radius.large],
    ["--shadow", brand.shadow],
    ...brand.spacing.map((value, index) => [`--space-${index}`, `${value}px`]),
    ...brand.typeScale.map((value, index) => [`--text-${index}`, `${value}px`]),
  ]) as CSSProperties;
  return (
    <html lang="en" style={tokens}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.description,
    start_url: "/app",
    display: "standalone",
    background_color: brand.colors.background,
    theme_color: brand.colors.primary,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

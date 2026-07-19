import type { MetadataRoute } from "next";

/** Makes the site installable ("Add to Home Screen") — opens standalone like
 *  a native app. Icons are generated at /icons/[size] from the brand mark. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reimburser",
    short_name: "Reimburser",
    description:
      "Share daily expenses transparently — supporters cover them directly, no middleman, no fees.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#fafafa",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

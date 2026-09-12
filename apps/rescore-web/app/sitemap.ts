import type { MetadataRoute } from "next";
import { allPaths } from "@rescore/content/landing";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rescore.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return allPaths().map((path) => ({
    url: `${SITE}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path.startsWith("/council/") ? "monthly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/rating/") ? 0.8 : 0.6,
  }));
}

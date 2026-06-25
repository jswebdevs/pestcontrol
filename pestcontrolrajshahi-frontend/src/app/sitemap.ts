import type { MetadataRoute } from "next";
import { serverFetch } from "@/lib/api";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pestcontrolrajshahi.com").replace(/\/$/, "");

/**
 * Dynamic sitemap. Static marketing pages + every published service detail
 * page (pulled live from the API, with the offline-snapshot fallback baked into
 * serverFetch so a backend hiccup never empties the sitemap). Only routes that
 * actually exist on the frontend are listed — no /projects (no public page).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const services = await serverFetch<any[]>("/services", { revalidate: 3600 }).catch(() => [] as any[]);
  const serviceEntries: MetadataRoute.Sitemap = (services || [])
    .filter((s) => s?.slug)
    .map((s) => ({
      url: `${BASE_URL}/services/${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticEntries, ...serviceEntries];
}

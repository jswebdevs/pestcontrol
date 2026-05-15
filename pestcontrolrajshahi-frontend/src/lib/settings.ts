import { serverFetch } from "./api";

export type SiteSettings = Record<string, any>;

export async function getSettings(): Promise<SiteSettings> {
  const data = await serverFetch<SiteSettings>("/settings", { revalidate: 60, tag: "settings" });
  return data ?? {};
}

export function kebab(s: string) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function buildThemeCss(settings: SiteSettings) {
  const colors = settings["theme.colors"] || {};
  const typography = settings["theme.typography"] || {};
  const radius = typography.radius ?? 14;
  const vars = Object.entries(colors)
    .map(([k, v]) => `--${kebab(k)}: ${v};`)
    .join("");
  return `:root{${vars}--radius: ${radius}px;--font-heading: '${typography.headingFont || "Manrope"}', sans-serif;--font-body: '${typography.bodyFont || "Inter"}', sans-serif;}`;
}

export function fontHref(headingFont = "Manrope", bodyFont = "Inter") {
  const fams = Array.from(new Set([headingFont, bodyFont]));
  const families = fams
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

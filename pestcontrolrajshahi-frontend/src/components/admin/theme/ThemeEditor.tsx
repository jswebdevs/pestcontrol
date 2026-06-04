"use client";

import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiPatch } from "@/lib/api";
import { RotateCcw } from "lucide-react";

type Colors = Record<string, string>;
type Typography = { headingFont?: string; bodyFont?: string; radius?: number };

interface ThemeEditorProps {
  initialColors: Colors;
  initialTypography: Typography;
  onSaved: () => void;
}

const DEFAULT_COLORS: Colors = {
  primary: "150 60% 35%",
  primaryForeground: "0 0% 100%",
  secondary: "150 30% 95%",
  secondaryForeground: "150 60% 15%",
  accent: "25 95% 55%",
  accentForeground: "0 0% 100%",
  background: "0 0% 100%",
  foreground: "150 30% 12%",
  muted: "150 20% 96%",
  mutedForeground: "150 10% 45%",
  card: "0 0% 100%",
  cardForeground: "150 30% 12%",
  destructive: "0 84% 60%",
  destructiveForeground: "0 0% 100%",
  border: "150 15% 88%",
  input: "150 15% 88%",
  ring: "150 60% 35%",
};

const FONTS = [
  "Plus Jakarta Sans",
  "Manrope",
  "Inter",
  "Poppins",
  "Rubik",
  "Sora",
  "Outfit",
];

export function ThemeEditor({ initialColors, initialTypography, onSaved }: ThemeEditorProps) {
  const [colors, setColors] = useState<Colors>(initialColors || DEFAULT_COLORS);
  const [typo, setTypo] = useState<Typography>({
    headingFont: "Plus Jakarta Sans",
    bodyFont: "Inter",
    radius: 12,
    ...(initialTypography || {}),
  });
  const [saving, setSaving] = useState(false);

  // Sync to a <style> tag in the document head so admin sees live preview
  useEffect(() => {
    const id = "admin-theme-preview";
    let styleEl = document.getElementById(id) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    const css = Object.entries(colors)
      .map(([k, v]) => `--${kebab(k)}: ${v};`)
      .join("");
    styleEl.textContent = `:root{${css}--radius:${typo.radius ?? 12}px;}`;
    return () => {
      // leave the preview in place — gets overwritten on next render
    };
  }, [colors, typo.radius]);

  async function save() {
    setSaving(true);
    try {
      await apiPatch("/admin/settings/theme.colors", { value: colors });
      await apiPatch("/admin/settings/theme.typography", { value: typo });
      toast.success("Theme saved");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setColors(DEFAULT_COLORS);
    setTypo({ headingFont: "Plus Jakarta Sans", bodyFont: "Inter", radius: 12 });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold">Typography</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label>Heading font</Label>
              <select
                value={typo.headingFont || ""}
                onChange={(e) => setTypo({ ...typo, headingFont: e.target.value })}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Body font</Label>
              <select
                value={typo.bodyFont || ""}
                onChange={(e) => setTypo({ ...typo, bodyFont: e.target.value })}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Corner radius: {typo.radius}px</Label>
              <input
                type="range"
                min={0}
                max={28}
                step={2}
                value={typo.radius ?? 12}
                onChange={(e) => setTypo({ ...typo, radius: parseInt(e.target.value, 10) })}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold">Colors</h3>
              <p className="text-xs text-muted-foreground">
                Click any swatch to open a color picker. Values are stored as HSL strings.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.keys(colors).map((k) => (
              <ColorRow
                key={k}
                name={k}
                value={colors[k]}
                onChange={(v) => setColors({ ...colors, [k]: v })}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-heading font-bold">Preview</h3>
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <h4 className="font-heading text-2xl font-bold">Sample heading</h4>
            <p className="text-sm text-muted-foreground">
              This is body text using your selected font and colors.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="p-4 rounded-xl bg-accent text-accent-foreground text-sm font-medium">
              Accent panel
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Reset to defaults
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save theme"}
        </Button>
      </div>
    </div>
  );
}

function ColorRow({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const hex = hslStringToHex(value);
  return (
    <div className="flex items-center gap-2 text-sm">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="size-9 rounded-md border shrink-0"
            style={{ backgroundColor: `hsl(${value})` }}
            aria-label={`Edit ${name}`}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <HexColorPicker color={hex} onChange={(h) => onChange(hexToHslString(h))} />
          <Input value={hex} onChange={(e) => onChange(hexToHslString(e.target.value))} className="mt-2 font-mono text-xs" />
        </PopoverContent>
      </Popover>
      <Label className="w-40 shrink-0 text-xs font-medium">{name}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
        aria-label={`${name} HSL value`}
      />
    </div>
  );
}

// ────────────────── helpers ──────────────────

function kebab(s: string) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function hslStringToHex(hsl: string): string {
  // Accepts "H S% L%" or "H S L" — last two may or may not have %
  const parts = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return "#000000";
  const [h, s, l] = parts;
  return hslToHex(h, s, l);
}

function hexToHslString(hex: string): string {
  const m = /^#?([a-f\d]{6}|[a-f\d]{3})$/i.exec(hex.trim());
  if (!m) return "0 0% 0%";
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgbToHslString(r, g, b);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHslString(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

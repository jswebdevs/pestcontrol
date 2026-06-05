"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api, apiGet } from "@/lib/api";

// Each Gemini call can take 10-40s with the fallback chain. The default axios
// timeout (20s) is too tight, so use a dedicated wrapper for AI calls.
async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const res = await api.post(path, body, { timeout: 180_000 });
  return res.data?.data ?? res.data;
}
import { Sparkles, Image as ImageIcon, Check, Loader2, AlertTriangle } from "lucide-react";

type SectionState = "idle" | "running" | "done" | "error";

interface Section {
  key: string;
  label: string;
  state: SectionState;
  result?: any;
  error?: string;
  modelUsed?: string;
}

interface ServiceResult {
  name: string;
  slug: string;
  shortDesc: string;
  longDescParagraphs: string[];
  bullets: string[];
  inclusions: string[];
  exclusions: string[];
  basePrice?: number;
  priceUnit?: string;
  seoTitle?: string;
  seoDescription?: string;
  imagePrompt: string;
  imageUrl?: string;
  imagePublicId?: string;
  modelUsed?: string;
  state: SectionState;
  error?: string;
}

const DEFAULT_SERVICES = `Cockroach Control
Termite Treatment
Mosquito Control
Rodent Control
Bed Bug Treatment
General Pest Control`;

export default function AiGeneratePage() {
  const [servicesInput, setServicesInput] = useState(DEFAULT_SERVICES);
  const [includeImages, setIncludeImages] = useState(true);
  const [running, setRunning] = useState(false);

  const [sections, setSections] = useState<Section[]>([
    { key: "home", label: "Home sections", state: "idle" },
    { key: "footer", label: "Footer", state: "idle" },
    { key: "about", label: "About page", state: "idle" },
    { key: "contact", label: "Contact intro", state: "idle" },
    { key: "faqs", label: "FAQs", state: "idle" },
    { key: "testimonials", label: "Testimonials", state: "idle" },
    { key: "projects", label: "Portfolio / projects (8)", state: "idle" },
    { key: "privacy", label: "Privacy policy", state: "idle" },
    { key: "refund", label: "Refund policy", state: "idle" },
    { key: "terms", label: "Terms of service", state: "idle" },
  ]);
  const [services, setServices] = useState<ServiceResult[]>([]);
  const [projects, setProjects] = useState<Array<{ title: string; slug: string; summary: string; imagePrompt?: string; imageUrl?: string }>>([]);
  const [heroImage, setHeroImage] = useState<{ url: string; publicId: string } | null>(null);
  const [wipeExisting, setWipeExisting] = useState(true);

  const status = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => apiGet<{ ready: boolean }>("/admin/ai/status").catch(() => ({ ready: false })),
  });
  const ready = status.data?.ready;

  const serviceNames = useMemo(
    () =>
      servicesInput
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    [servicesInput],
  );

  function updateSection(key: string, patch: Partial<Section>) {
    setSections((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  async function runSection(key: string, endpoint: string, body?: any) {
    updateSection(key, { state: "running", error: undefined });
    try {
      const res = await apiPost<any>(endpoint, body);
      updateSection(key, { state: "done", result: res?.data ?? res, modelUsed: res?.modelUsed });
      return res?.data ?? res;
    } catch (e: any) {
      const msg = e?.response?.data?.message?.message || e?.response?.data?.message || e?.message || "failed";
      updateSection(key, { state: "error", error: String(msg) });
      throw e;
    }
  }

  async function generateAll() {
    if (!ready) {
      toast.error("Gemini is not configured. Set GEMINI_API_KEY in the backend .env and restart.");
      return;
    }
    if (serviceNames.length === 0) {
      toast.error("Add at least one service name.");
      return;
    }
    setRunning(true);
    setServices(serviceNames.map((n) => ({
      name: n,
      slug: "",
      shortDesc: "",
      longDescParagraphs: [],
      bullets: [],
      inclusions: [],
      exclusions: [],
      imagePrompt: "",
      state: "idle",
    })));

    try {
      // Stage 1 — global sections in parallel
      const stage1 = [
        runSection("home", "/admin/ai/home").catch(() => null),
        runSection("footer", "/admin/ai/footer").catch(() => null),
        runSection("about", "/admin/ai/about").catch(() => null),
        runSection("contact", "/admin/ai/contact").catch(() => null),
        runSection("faqs", "/admin/ai/faqs", { serviceNames }).catch(() => null),
        runSection("testimonials", "/admin/ai/testimonials", { serviceNames }).catch(() => null),
        runSection("projects", "/admin/ai/projects", { serviceNames, count: 8 }).catch(() => null),
      ];
      const [home, _f, _a, _c, _q, _t, projectsData] = await Promise.all(stage1);
      if (projectsData?.items?.length) {
        setProjects(projectsData.items.map((p: any) => ({
          title: p.title,
          slug: p.slug,
          summary: p.summary,
          imagePrompt: p.imagePrompt,
        })));
      }

      // Stage 2 — policies (sequential to be gentle on rate limits)
      await runSection("privacy", "/admin/ai/policy", { kind: "privacy" }).catch(() => null);
      await runSection("refund", "/admin/ai/policy", { kind: "refund" }).catch(() => null);
      await runSection("terms", "/admin/ai/policy", { kind: "terms" }).catch(() => null);

      // Stage 3 — per-service text (sequential). We also keep a local mirror
      // of the latest data so Stage 4 can use it without racing setState.
      const localServices: ServiceResult[] = serviceNames.map((n) => ({
        name: n,
        slug: "",
        shortDesc: "",
        longDescParagraphs: [],
        bullets: [],
        inclusions: [],
        exclusions: [],
        imagePrompt: "",
        state: "idle",
      }));
      for (let i = 0; i < serviceNames.length; i++) {
        const name = serviceNames[i];
        setServices((cur) => cur.map((s, idx) => (idx === i ? { ...s, state: "running" } : s)));
        try {
          const res = await apiPost<any>("/admin/ai/service", { name });
          const data = res?.data ?? res;
          localServices[i] = { ...localServices[i], ...data, modelUsed: res?.modelUsed, state: "done" };
          setServices((cur) =>
            cur.map((s, idx) => (idx === i ? localServices[i] : s)),
          );
        } catch (e: any) {
          const msg = e?.response?.data?.message?.message || e?.message || "failed";
          localServices[i] = { ...localServices[i], state: "error", error: msg };
          setServices((cur) => cur.map((s, idx) => (idx === i ? localServices[i] : s)));
        }
      }

      // Stage 4 — images
      if (includeImages) {
        if (home?.hero?.imagePrompt) {
          try {
            const img = await apiPost<any>("/admin/ai/image", {
              prompt: home.hero.imagePrompt,
              folderTag: "hero",
              alt: home.hero.heading,
            });
            setHeroImage({ url: img.url, publicId: img.publicId });
          } catch (e: any) {
            toast.error(`Hero image: ${e?.response?.data?.message?.message || e?.message}`);
          }
        }

        for (let i = 0; i < localServices.length; i++) {
          const current = localServices[i];
          if (!current?.imagePrompt || current.state !== "done") continue;
          try {
            const img = await apiPost<any>("/admin/ai/image", {
              prompt: current.imagePrompt,
              folderTag: `service-${current.slug || current.name}`,
              alt: current.name,
            });
            localServices[i] = { ...current, imageUrl: img.url, imagePublicId: img.publicId };
            setServices((cur) =>
              cur.map((s, idx) => (idx === i ? localServices[i] : s)),
            );
          } catch (e: any) {
            toast.error(`${current.name} image: ${e?.response?.data?.message?.message || e?.message}`);
          }
        }

        // Per-project images
        const projItems = projectsData?.items || [];
        for (let i = 0; i < projItems.length; i++) {
          const p = projItems[i];
          if (!p?.imagePrompt) continue;
          try {
            const img = await apiPost<any>("/admin/ai/image", {
              prompt: p.imagePrompt,
              folderTag: `project-${p.slug || p.title}`,
              alt: p.title,
            });
            projItems[i].imageUrl = img.url;
            projItems[i].imagePublicId = img.publicId;
            setProjects((cur) =>
              cur.map((x, idx) => (idx === i ? { ...x, imageUrl: img.url } : x)),
            );
          } catch (e: any) {
            toast.error(`Project ${p.title} image: ${e?.response?.data?.message?.message || e?.message}`);
          }
        }
      }

      toast.success("Generation complete. Review and click Apply to save.");
    } finally {
      setRunning(false);
    }
  }

  async function applyAll() {
    const get = (key: string) => sections.find((s) => s.key === key)?.result;
    const projectsResult = get("projects");
    const payload = {
      wipeContent: wipeExisting,
      home: get("home"),
      footer: get("footer"),
      about: get("about"),
      contact: get("contact"),
      faqs: get("faqs"),
      testimonials: get("testimonials"),
      policies: {
        privacy: get("privacy"),
        refund: get("refund"),
        terms: get("terms"),
      },
      services: services
        .filter((s) => s.state === "done")
        .map((s) => ({
          name: s.name,
          slug: s.slug,
          shortDesc: s.shortDesc,
          longDescParagraphs: s.longDescParagraphs,
          bullets: s.bullets,
          inclusions: s.inclusions,
          exclusions: s.exclusions,
          basePrice: s.basePrice,
          priceUnit: s.priceUnit,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          imagePrompt: s.imagePrompt,
          imageUrl: s.imageUrl,
          imagePublicId: s.imagePublicId,
        })),
      projects: (projectsResult?.items || []).map((p: any) => ({
        title: p.title,
        slug: p.slug,
        client: p.client,
        category: p.category,
        summary: p.summary,
        bodyParagraphs: p.bodyParagraphs,
        dateIso: p.dateIso,
        imagePrompt: p.imagePrompt,
        imageUrl: p.imageUrl,
        imagePublicId: p.imagePublicId,
      })),
    };
    try {
      const res = await apiPost<any>("/admin/ai/apply", payload);
      toast.success(`Applied: ${JSON.stringify(res?.summary || res)}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message?.message || e?.message || "apply failed");
    }
  }

  const anyResult =
    sections.some((s) => s.state === "done") || services.some((s) => s.state === "done");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-6 text-primary" /> AI Site Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate Bangla content for the entire site from Gemini. Review each section, then click
          Apply to write to the database.
        </p>
      </div>

      {status.data && !ready && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            Gemini is not configured. Set <code className="px-1 bg-muted rounded">GEMINI_API_KEY</code> in the backend <code className="px-1 bg-muted rounded">.env</code> and restart.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label htmlFor="services">Services (one per line, English or Bangla)</Label>
            <Textarea
              id="services"
              value={servicesInput}
              onChange={(e) => setServicesInput(e.target.value)}
              rows={8}
              className="mt-2 font-mono text-sm"
              disabled={running}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="img"
              checked={includeImages}
              onCheckedChange={setIncludeImages}
              disabled={running}
            />
            <Label htmlFor="img" className="cursor-pointer">
              Also generate images (hero + per-service + per-project)
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="wipe"
              checked={wipeExisting}
              onCheckedChange={setWipeExisting}
              disabled={running}
            />
            <Label htmlFor="wipe" className="cursor-pointer">
              Wipe existing services + projects on apply (recommended for first run)
            </Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateAll} disabled={running || !ready} size="lg">
              {running ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="size-4 mr-2" /> Generate site content</>
              )}
            </Button>
            {anyResult && !running && (
              <Button onClick={applyAll} size="lg" variant="default" className="bg-green-600 hover:bg-green-700">
                <Check className="size-4 mr-2" /> Apply to site
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global sections */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-heading text-lg font-bold">Global sections</h2>
          <div className="space-y-2">
            {sections.map((s) => (
              <SectionRow key={s.key} section={s} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hero image */}
      {heroImage && (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
              <ImageIcon className="size-5" /> Hero image
            </h2>
            <img src={heroImage.url} alt="hero" className="rounded-lg max-h-80 object-cover" />
          </CardContent>
        </Card>
      )}

      {/* Services */}
      {services.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-heading text-lg font-bold">Services</h2>
            <div className="space-y-4">
              {services.map((s, i) => (
                <ServiceRow key={i} svc={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects (portfolio) */}
      {projects.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-heading text-lg font-bold">Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {projects.map((p, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      image pending
                    </div>
                  )}
                  <div className="p-2 text-xs">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-muted-foreground truncate">{p.slug}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StateBadge({ state }: { state: SectionState }) {
  if (state === "idle") return <Badge variant="outline">idle</Badge>;
  if (state === "running") return <Badge className="bg-blue-500">running</Badge>;
  if (state === "done") return <Badge className="bg-green-600">done</Badge>;
  return <Badge variant="destructive">error</Badge>;
}

function SectionRow({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <StateBadge state={section.state} />
          <span className="font-medium">{section.label}</span>
          {section.modelUsed && (
            <span className="text-xs text-muted-foreground">via {section.modelUsed}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <div className="p-3 border-t bg-muted/20">
          {section.error && (
            <pre className="text-xs text-destructive whitespace-pre-wrap">{section.error}</pre>
          )}
          {section.result && (
            <pre className="text-xs whitespace-pre-wrap break-all max-h-80 overflow-auto">
              {JSON.stringify(section.result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function ServiceRow({ svc }: { svc: ServiceResult }) {
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StateBadge state={svc.state} />
          <div>
            <div className="font-medium">{svc.name}</div>
            {svc.slug && <div className="text-xs text-muted-foreground">{svc.slug}</div>}
          </div>
        </div>
        {svc.modelUsed && (
          <span className="text-xs text-muted-foreground">via {svc.modelUsed}</span>
        )}
      </div>
      {svc.error && (
        <pre className="text-xs text-destructive whitespace-pre-wrap">{svc.error}</pre>
      )}
      {svc.shortDesc && (
        <div className="grid md:grid-cols-[200px_1fr] gap-3">
          {svc.imageUrl ? (
            <img src={svc.imageUrl} alt={svc.name} className="rounded object-cover w-full aspect-square" />
          ) : (
            <div className="rounded bg-muted aspect-square flex items-center justify-center text-xs text-muted-foreground">
              {svc.imagePrompt ? "image pending" : "no image"}
            </div>
          )}
          <div className="space-y-1 text-sm">
            <div>{svc.shortDesc}</div>
            {svc.bullets?.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                {svc.bullets.slice(0, 4).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

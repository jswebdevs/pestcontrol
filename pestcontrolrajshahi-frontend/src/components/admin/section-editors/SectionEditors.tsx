"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Repeater } from "./Repeater";
import { MediaPickerField } from "@/components/admin/media/MediaPicker";
import { TiptapEditor } from "@/components/admin/editor/TiptapEditor";

// ────────────────── General / business.info ──────────────────

interface BusinessInfo {
  name?: string;
  license?: string;
  established?: string;
}
export function BusinessInfoEditor({ value, onChange }: { value: BusinessInfo; onChange: (n: BusinessInfo) => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Business name</Label>
        <Input value={value.name || ""} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>License #</Label>
          <Input value={value.license || ""} onChange={(e) => onChange({ ...value, license: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Established (year)</Label>
          <Input value={value.established || ""} onChange={(e) => onChange({ ...value, established: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

// ────────────────── Header ──────────────────

interface NavItem { label: string; href: string; }
interface HeaderSetting {
  logo?: string | null;
  topBar?: { phone?: string; text?: string };
  nav?: NavItem[];
}
export function HeaderEditor({ value, onChange }: { value: HeaderSetting; onChange: (n: HeaderSetting) => void }) {
  const nav = value.nav ?? [];
  return (
    <div className="space-y-4">
      <MediaPickerField
        label="Logo"
        value={value.logo || null}
        onChange={(pid) => onChange({ ...value, logo: pid ?? undefined })}
        w={240}
        h={80}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Top bar phone</Label>
          <Input value={value.topBar?.phone || ""} onChange={(e) => onChange({ ...value, topBar: { ...value.topBar, phone: e.target.value } })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Top bar tagline</Label>
          <Input value={value.topBar?.text || ""} onChange={(e) => onChange({ ...value, topBar: { ...value.topBar, text: e.target.value } })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Navigation</Label>
        <Repeater<NavItem>
          items={nav}
          onChange={(items) => onChange({ ...value, nav: items })}
          newItem={() => ({ label: "New", href: "/" })}
          itemLabel={(it) => it.label || "Untitled"}
          addLabel="Add link"
          renderItem={(it, _i, upd) => (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Label" value={it.label} onChange={(e) => upd({ label: e.target.value })} />
              <Input placeholder="/href" value={it.href} onChange={(e) => upd({ href: e.target.value })} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ────────────────── Hero (slides repeater) ──────────────────

interface HeroSlide {
  image?: string | null;
  headline: string;
  sub?: string;
  cta?: { label?: string; href?: string };
}
interface HeroSetting { slides?: HeroSlide[]; }
export function HeroEditor({ value, onChange }: { value: HeroSetting; onChange: (n: HeroSetting) => void }) {
  const slides = value.slides ?? [];
  return (
    <Repeater<HeroSlide>
      items={slides}
      onChange={(items) => onChange({ slides: items })}
      newItem={() => ({ headline: "", sub: "", cta: { label: "Book Now", href: "/order" } })}
      itemLabel={(s, i) => s.headline || `Slide ${i + 1}`}
      addLabel="Add slide"
      renderItem={(s, _i, upd) => (
        <div className="grid gap-3">
          <MediaPickerField
            label="Image"
            value={s.image || null}
            onChange={(pid) => upd({ image: pid ?? undefined })}
            w={1600}
            h={900}
          />
          <div className="grid gap-1.5">
            <Label>Headline</Label>
            <Input value={s.headline} onChange={(e) => upd({ headline: e.target.value })} />
          </div>
          <div className="grid gap-1.5">
            <Label>Sub-headline</Label>
            <Textarea rows={2} value={s.sub || ""} onChange={(e) => upd({ sub: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label>CTA label</Label>
              <Input value={s.cta?.label || ""} onChange={(e) => upd({ cta: { ...s.cta, label: e.target.value } })} />
            </div>
            <div className="grid gap-1.5">
              <Label>CTA link</Label>
              <Input value={s.cta?.href || ""} onChange={(e) => upd({ cta: { ...s.cta, href: e.target.value } })} />
            </div>
          </div>
        </div>
      )}
    />
  );
}

// ────────────────── About (rich text + stats) ──────────────────

interface AboutSetting {
  title?: string;
  body?: any;
  image?: string | null;
  stats?: Array<{ label: string; value: string }>;
}
export function AboutEditor({ value, onChange }: { value: AboutSetting; onChange: (n: AboutSetting) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label>Title</Label>
        <Input value={value.title || ""} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <MediaPickerField label="Image" value={value.image || null} onChange={(pid) => onChange({ ...value, image: pid ?? undefined })} w={1200} h={960} />
      <div className="grid gap-1.5">
        <Label>Body</Label>
        <TiptapEditor value={value.body || { type: "doc", content: [] }} onChange={(b) => onChange({ ...value, body: b })} />
      </div>
      <div className="space-y-2">
        <Label>Stats</Label>
        <Repeater
          items={value.stats || []}
          onChange={(items) => onChange({ ...value, stats: items })}
          newItem={() => ({ label: "", value: "" })}
          itemLabel={(s) => s.label || "Stat"}
          addLabel="Add stat"
          renderItem={(s, _i, upd) => (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Value (e.g. 3.8k+)" value={s.value} onChange={(e) => upd({ value: e.target.value })} />
              <Input placeholder="Label (e.g. Properties served)" value={s.label} onChange={(e) => upd({ label: e.target.value })} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ────────────────── Trust badges, How it works, Why choose us (icon+text repeater) ──────────────────

interface BadgeSetting { badges?: Array<{ icon?: string; label: string }>; }
export function TrustBadgesEditor({ value, onChange }: { value: BadgeSetting; onChange: (n: BadgeSetting) => void }) {
  return (
    <Repeater
      items={value.badges || []}
      onChange={(items) => onChange({ badges: items })}
      newItem={() => ({ icon: "shield-check", label: "" })}
      itemLabel={(b) => b.label || "Badge"}
      addLabel="Add badge"
      renderItem={(b, _i, upd) => (
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <Input placeholder="lucide icon (e.g. leaf)" value={b.icon || ""} onChange={(e) => upd({ icon: e.target.value })} />
          <Input placeholder="Label" value={b.label} onChange={(e) => upd({ label: e.target.value })} />
        </div>
      )}
    />
  );
}

interface StepsSetting { title?: string; steps?: Array<{ icon?: string; title: string; desc?: string }>; }
export function StepsEditor({ value, onChange }: { value: StepsSetting; onChange: (n: StepsSetting) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label>Section title</Label>
        <Input value={value.title || ""} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <Repeater
        items={value.steps || []}
        onChange={(items) => onChange({ ...value, steps: items })}
        newItem={() => ({ icon: "sparkles", title: "", desc: "" })}
        itemLabel={(s) => s.title || "Step"}
        addLabel="Add step"
        renderItem={(s, _i, upd) => (
          <div className="grid gap-2">
            <div className="grid grid-cols-[140px_1fr] gap-2">
              <Input placeholder="lucide icon" value={s.icon || ""} onChange={(e) => upd({ icon: e.target.value })} />
              <Input placeholder="Title" value={s.title} onChange={(e) => upd({ title: e.target.value })} />
            </div>
            <Textarea rows={2} placeholder="Description" value={s.desc || ""} onChange={(e) => upd({ desc: e.target.value })} />
          </div>
        )}
      />
    </div>
  );
}

interface PointsSetting { title?: string; points?: Array<{ icon?: string; title: string; desc?: string }>; }
export function PointsEditor({ value, onChange }: { value: PointsSetting; onChange: (n: PointsSetting) => void }) {
  return <StepsEditor value={{ title: value.title, steps: value.points }} onChange={(v) => onChange({ title: v.title, points: v.steps })} />;
}

// ────────────────── Final CTA ──────────────────

interface CtaSetting {
  title?: string;
  sub?: string;
  cta?: { label?: string; href?: string };
  background?: string;
}
export function FinalCtaEditor({ value, onChange }: { value: CtaSetting; onChange: (n: CtaSetting) => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Title</Label>
        <Input value={value.title || ""} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Sub-headline</Label>
        <Textarea rows={2} value={value.sub || ""} onChange={(e) => onChange({ ...value, sub: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label>CTA label</Label>
          <Input value={value.cta?.label || ""} onChange={(e) => onChange({ ...value, cta: { ...value.cta, label: e.target.value } })} />
        </div>
        <div className="grid gap-1.5">
          <Label>CTA link</Label>
          <Input value={value.cta?.href || ""} onChange={(e) => onChange({ ...value, cta: { ...value.cta, href: e.target.value } })} />
        </div>
      </div>
    </div>
  );
}

// ────────────────── Section heading (title + optional sub) ──────────────────

interface SectionHeading { title?: string; sub?: string }
export function SectionHeadingEditor({
  value,
  onChange,
  withSub = true,
}: {
  value: SectionHeading;
  onChange: (n: SectionHeading) => void;
  withSub?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label>Heading</Label>
        <Input value={value.title || ""} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      {withSub && (
        <div className="grid gap-1.5">
          <Label>Sub-heading</Label>
          <Input value={value.sub || ""} onChange={(e) => onChange({ ...value, sub: e.target.value })} />
        </div>
      )}
    </div>
  );
}

// ────────────────── Footer ──────────────────

interface FooterContactSetting {
  logo?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  copyright?: string;
  mapEmbedUrl?: string;
  socials?: Array<{ icon: string; href: string }>;
}
export function FooterContactEditor({ value, onChange }: { value: FooterContactSetting; onChange: (n: FooterContactSetting) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <MediaPickerField
          label="Footer logo"
          value={value.logo || null}
          onChange={(pid) => onChange({ ...value, logo: pid ?? undefined })}
          w={400}
          h={100}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional; falls back to the header logo if blank. Click the picker to choose from the media library or upload a new image.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label>Tagline (small details under the logo)</Label>
        <Input
          value={value.tagline || ""}
          onChange={(e) => onChange({ ...value, tagline: e.target.value })}
          placeholder="One-sentence pitch shown under the brand"
        />
        <p className="text-xs text-muted-foreground">
          The short details line shown under the footer logo in column 1.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Phone</Label>
          <Input value={value.phone || ""} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Email</Label>
          <Input value={value.email || ""} onChange={(e) => onChange({ ...value, email: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Address</Label>
        <Input value={value.address || ""} onChange={(e) => onChange({ ...value, address: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Hours</Label>
        <Input value={value.hours || ""} onChange={(e) => onChange({ ...value, hours: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Copyright</Label>
        <Input
          value={value.copyright || ""}
          onChange={(e) => onChange({ ...value, copyright: e.target.value })}
          placeholder="© 2026 Your Brand. All rights reserved."
        />
        <p className="text-xs text-muted-foreground">Use {`{year}`} as a placeholder for the current year.</p>
      </div>
      <div className="grid gap-1.5">
        <Label>Google Map embed URL</Label>
        <Input
          value={value.mapEmbedUrl || ""}
          onChange={(e) => onChange({ ...value, mapEmbedUrl: e.target.value })}
          placeholder="https://www.google.com/maps/embed?pb=..."
        />
        <p className="text-xs text-muted-foreground">
          On Google Maps: click <strong>Share → Embed a map</strong>, copy the <code>src</code> URL from the iframe code.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Socials</Label>
        <Repeater
          items={value.socials || []}
          onChange={(items) => onChange({ ...value, socials: items })}
          newItem={() => ({ icon: "facebook", href: "" })}
          itemLabel={(s) => s.icon || "Social"}
          addLabel="Add social"
          renderItem={(s, _i, upd) => (
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <Input placeholder="icon" value={s.icon} onChange={(e) => upd({ icon: e.target.value })} />
              <Input placeholder="https://..." value={s.href} onChange={(e) => upd({ href: e.target.value })} />
            </div>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Supported icon keys: <code>facebook</code>, <code>instagram</code>, <code>twitter</code> (or <code>x</code>),{" "}
          <code>youtube</code>, <code>linkedin</code>, <code>whatsapp</code>, <code>tiktok</code>. Others render blank.
        </p>
      </div>
    </div>
  );
}

interface FooterColumnsSetting {
  columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
}
export function FooterColumnsEditor({ value, onChange }: { value: FooterColumnsSetting; onChange: (n: FooterColumnsSetting) => void }) {
  return (
    <Repeater
      items={value.columns || []}
      onChange={(items) => onChange({ columns: items })}
      newItem={() => ({ title: "Column", links: [{ label: "Home", href: "/" }] })}
      itemLabel={(c) => c.title || "Column"}
      addLabel="Add column"
      renderItem={(c, _i, upd) => (
        <div className="space-y-2">
          <Input placeholder="Column title" value={c.title} onChange={(e) => upd({ title: e.target.value })} />
          <Repeater
            items={c.links || []}
            onChange={(links) => upd({ links })}
            newItem={() => ({ label: "", href: "" })}
            itemLabel={(l) => l.label || "Link"}
            addLabel="Add link"
            renderItem={(l, _li, lUpd) => (
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Label" value={l.label} onChange={(e) => lUpd({ label: e.target.value })} />
                <Input placeholder="/href" value={l.href} onChange={(e) => lUpd({ href: e.target.value })} />
              </div>
            )}
          />
        </div>
      )}
    />
  );
}

// ────────────────── SEO defaults ──────────────────

interface SeoSetting { title?: string; description?: string; ogImage?: string | null; }
export function SeoEditor({ value, onChange }: { value: SeoSetting; onChange: (n: SeoSetting) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label>Default title</Label>
        <Input value={value.title || ""} onChange={(e) => onChange({ ...value, title: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label>Default description</Label>
        <Textarea rows={2} value={value.description || ""} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </div>
      <MediaPickerField label="Default OG image" value={value.ogImage || null} onChange={(pid) => onChange({ ...value, ogImage: pid ?? undefined })} w={1200} h={630} />
    </div>
  );
}

// ────────────────── Legal (rich text) ──────────────────

export function LegalEditor({ value, onChange }: { value: any; onChange: (n: any) => void }) {
  return (
    <TiptapEditor
      value={value || { type: "doc", content: [] }}
      onChange={onChange}
    />
  );
}

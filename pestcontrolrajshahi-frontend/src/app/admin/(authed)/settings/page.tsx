"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeEditor } from "@/components/admin/theme/ThemeEditor";
import { SettingShell } from "@/components/admin/section-editors/SettingShell";
import {
  BusinessInfoEditor,
  HeaderEditor,
  HeroEditor,
  AboutEditor,
  TrustBadgesEditor,
  StepsEditor,
  PointsEditor,
  FinalCtaEditor,
  FooterContactEditor,
  FooterColumnsEditor,
  SeoEditor,
  LegalEditor,
  SectionHeadingEditor,
} from "@/components/admin/section-editors/SectionEditors";

export default function AdminSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-settings"], queryFn: () => apiGet("/admin/settings") });
  const data = q.data || {};
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-settings"] });

  if (q.isLoading) return <div className="p-6 text-muted-foreground text-sm">Loading settings…</div>;

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="home">Home sections</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <SettingShell sKey="business.info" title="Business info" value={data["business.info"] || {}} onSaved={refresh}>
            {(d, set) => <BusinessInfoEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>

        <TabsContent value="header" className="space-y-4">
          <SettingShell sKey="home.header" title="Header" description="Logo, top bar and navigation" value={data["home.header"] || {}} onSaved={refresh}>
            {(d, set) => <HeaderEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <SettingShell sKey="home.hero" title="Hero slider" description="Top-of-homepage slides" value={data["home.hero"] || { slides: [] }} onSaved={refresh}>
            {(d, set) => <HeroEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>

        <TabsContent value="home" className="space-y-4">
          <SettingShell sKey="home.about" title="About section" value={data["home.about"] || {}} onSaved={refresh}>
            {(d, set) => <AboutEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="home.trustBadges" title="Trust badges" value={data["home.trustBadges"] || { badges: [] }} onSaved={refresh}>
            {(d, set) => <TrustBadgesEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="home.serviceCards" title="Services section heading" value={data["home.serviceCards"] || {}} onSaved={refresh}>
            {(d, set) => <SectionHeadingEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="home.howItWorks" title="How it works" value={data["home.howItWorks"] || { steps: [] }} onSaved={refresh}>
            {(d, set) => <StepsEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="home.whyChooseUs" title="Why choose us" value={data["home.whyChooseUs"] || { points: [] }} onSaved={refresh}>
            {(d, set) => <PointsEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="home.testimonials" title="Testimonials section heading" value={data["home.testimonials"] || {}} onSaved={refresh}>
            {(d, set) => <SectionHeadingEditor value={d} onChange={set} withSub={false} />}
          </SettingShell>
          <SettingShell sKey="home.finalCta" title="Final CTA" value={data["home.finalCta"] || {}} onSaved={refresh}>
            {(d, set) => <FinalCtaEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <SettingShell sKey="footer.contact" title="Footer contact" value={data["footer.contact"] || {}} onSaved={refresh}>
            {(d, set) => <FooterContactEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="footer.columns" title="Footer columns" value={data["footer.columns"] || { columns: [] }} onSaved={refresh}>
            {(d, set) => <FooterColumnsEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <SettingShell sKey="seo.default" title="Default SEO" value={data["seo.default"] || {}} onSaved={refresh}>
            {(d, set) => <SeoEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>

        <TabsContent value="theme">
          <ThemeEditor
            initialColors={data["theme.colors"] || {}}
            initialTypography={data["theme.typography"] || {}}
            onSaved={refresh}
          />
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <SettingShell sKey="legal.privacy" title="Privacy policy" value={data["legal.privacy"] || { type: "doc", content: [] }} onSaved={refresh}>
            {(d, set) => <LegalEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="legal.terms" title="Terms & conditions" value={data["legal.terms"] || { type: "doc", content: [] }} onSaved={refresh}>
            {(d, set) => <LegalEditor value={d} onChange={set} />}
          </SettingShell>
          <SettingShell sKey="legal.refund" title="Refund policy" value={data["legal.refund"] || { type: "doc", content: [] }} onSaved={refresh}>
            {(d, set) => <LegalEditor value={d} onChange={set} />}
          </SettingShell>
        </TabsContent>
      </Tabs>
    </div>
  );
}

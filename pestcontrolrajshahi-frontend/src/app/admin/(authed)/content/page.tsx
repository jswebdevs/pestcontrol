"use client";

// Content hub — single launchpad for every manually-editable surface on the
// public site. Replaces the retired AI Generate page: instead of generating
// content, the admin picks a section and edits it directly.
//
// Counts on the live cards (services / gallery / testimonials / FAQs) come
// from the public list endpoints so the hub also doubles as a quick health
// check ("is anything missing?").

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  LayoutDashboard,
  Briefcase,
  Images,
  MessageSquare,
  HelpCircle,
  Image as ImageIcon,
  PanelTop,
  Sparkles as SparklesIcon,
  Info,
  ShieldCheck,
  FileText,
  Settings as SettingsIcon,
  PanelBottom,
  Search,
  Palette,
  Gavel,
  ListChecks,
  Star,
  Phone,
} from "lucide-react";

type Tile = {
  group: "Pages" | "Home sections" | "Site chrome" | "Catalog" | "Legal";
  title: string;
  desc: string;
  href: string;
  icon: any;
  count?: number | string;
};

export default function ContentHub() {
  const settings = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiGet<Record<string, any>>("/admin/settings"),
  });
  const services = useQuery({
    queryKey: ["admin-content-services"],
    queryFn: () => apiGet<any[]>("/services"),
  });
  const gallery = useQuery({
    queryKey: ["admin-content-gallery"],
    queryFn: () => apiGet<any[]>("/gallery"),
  });
  const testimonials = useQuery({
    queryKey: ["admin-content-testimonials"],
    queryFn: () => apiGet<any[]>("/testimonials"),
  });
  const faqs = useQuery({
    queryKey: ["admin-content-faqs"],
    queryFn: () => apiGet<any[]>("/faqs"),
  });

  const s = settings.data || {};
  const hasKey = (k: string) => Boolean(s[k]) && Object.keys(s[k] || {}).length > 0;
  const heroSlides: any[] = s["home.hero"]?.slides || [];
  const trustBadges: any[] = s["home.trustBadges"]?.badges || [];
  const howStepsCount = (s["home.howItWorks"]?.steps || []).length;
  const whyPointsCount = (s["home.whyChooseUs"]?.points || []).length;
  const footerColumnsCount = (s["footer.columns"]?.columns || []).length;

  const tiles: Tile[] = [
    // Site chrome
    {
      group: "Site chrome",
      title: "Business info",
      desc: "Name, logo, brand basics",
      href: "/admin/settings?tab=general",
      icon: Info,
      count: s["business.info"]?.name || "—",
    },
    {
      group: "Site chrome",
      title: "Header & nav",
      desc: "Top bar, logo, menu items",
      href: "/admin/settings?tab=header",
      icon: PanelTop,
      count: (s["home.header"]?.nav || []).length + " links",
    },
    {
      group: "Site chrome",
      title: "Footer contact",
      desc: "Phone, email, address, hours, socials",
      href: "/admin/settings?tab=footer",
      icon: Phone,
      count: s["footer.contact"]?.phone ? "✓ set" : "Not set",
    },
    {
      group: "Site chrome",
      title: "Footer columns",
      desc: "Quick-link columns at the bottom",
      href: "/admin/settings?tab=footer",
      icon: PanelBottom,
      count: footerColumnsCount + " columns",
    },
    {
      group: "Site chrome",
      title: "SEO defaults",
      desc: "Default title, description, og:image",
      href: "/admin/settings?tab=seo",
      icon: Search,
      count: hasKey("seo.default") ? "✓ set" : "Not set",
    },
    {
      group: "Site chrome",
      title: "Theme",
      desc: "Brand colors and typography",
      href: "/admin/settings?tab=theme",
      icon: Palette,
      count: "Colors + fonts",
    },

    // Home sections
    {
      group: "Home sections",
      title: "Hero slider",
      desc: "Top-of-page slides with copy + CTA",
      href: "/admin/settings?tab=hero",
      icon: SparklesIcon,
      count: heroSlides.length + " slides",
    },
    {
      group: "Home sections",
      title: "Trust badges",
      desc: "Strip under the hero",
      href: "/admin/settings?tab=home",
      icon: ShieldCheck,
      count: trustBadges.length + " badges",
    },
    {
      group: "Home sections",
      title: "About section",
      desc: "Heading, body, image, stats",
      href: "/admin/settings?tab=home",
      icon: Info,
      count: hasKey("home.about") ? "✓ set" : "Not set",
    },
    {
      group: "Home sections",
      title: "Service section heading",
      desc: "Title + sub above the service grid",
      href: "/admin/settings?tab=home",
      icon: ListChecks,
      count: s["home.serviceCards"]?.title ? "✓ set" : "Not set",
    },
    {
      group: "Home sections",
      title: "How it works",
      desc: "Numbered steps that explain your flow",
      href: "/admin/settings?tab=home",
      icon: ListChecks,
      count: howStepsCount + " steps",
    },
    {
      group: "Home sections",
      title: "Why choose us",
      desc: "Pillar cards under the steps",
      href: "/admin/settings?tab=home",
      icon: Star,
      count: whyPointsCount + " points",
    },
    {
      group: "Home sections",
      title: "Testimonials heading",
      desc: "Section title above customer quotes",
      href: "/admin/settings?tab=home",
      icon: MessageSquare,
      count: s["home.testimonials"]?.title ? "✓ set" : "Not set",
    },
    {
      group: "Home sections",
      title: "Final CTA",
      desc: "Banner at the bottom of the homepage",
      href: "/admin/settings?tab=home",
      icon: SparklesIcon,
      count: s["home.finalCta"]?.title ? "✓ set" : "Not set",
    },

    // Catalog
    {
      group: "Catalog",
      title: "Services",
      desc: "Add, edit, reorder, mark as featured",
      href: "/admin/services",
      icon: Briefcase,
      count: services.data?.length ?? "—",
    },
    {
      group: "Catalog",
      title: "Gallery",
      desc: "On-site work photos shown on /gallery",
      href: "/admin/gallery",
      icon: Images,
      count: gallery.data?.length ?? "—",
    },
    {
      group: "Catalog",
      title: "Testimonials",
      desc: "Customer quotes shown on the homepage",
      href: "/admin/testimonials",
      icon: MessageSquare,
      count: testimonials.data?.length ?? "—",
    },
    {
      group: "Catalog",
      title: "FAQs",
      desc: "Service-page Q&A and trust signals",
      href: "/admin/faqs",
      icon: HelpCircle,
      count: faqs.data?.length ?? "—",
    },
    {
      group: "Catalog",
      title: "Media library",
      desc: "Cloudinary assets used across the site",
      href: "/admin/media",
      icon: ImageIcon,
      count: "Browse",
    },

    // Pages
    {
      group: "Pages",
      title: "Dashboard",
      desc: "Orders, revenue and customer stats",
      href: "/admin",
      icon: LayoutDashboard,
      count: "Live",
    },
    {
      group: "Pages",
      title: "Orders",
      desc: "Bookings from /book and contact form",
      href: "/admin/orders",
      icon: ListChecks,
    },
    {
      group: "Pages",
      title: "All settings",
      desc: "Every key in one tabbed editor",
      href: "/admin/settings",
      icon: SettingsIcon,
    },

    // Legal
    {
      group: "Legal",
      title: "Privacy policy",
      desc: "Shown at /privacy",
      href: "/admin/settings?tab=legal",
      icon: FileText,
      count: hasKey("legal.privacy") ? "✓ set" : "Not set",
    },
    {
      group: "Legal",
      title: "Terms & conditions",
      desc: "Shown at /terms",
      href: "/admin/settings?tab=legal",
      icon: Gavel,
      count: hasKey("legal.terms") ? "✓ set" : "Not set",
    },
    {
      group: "Legal",
      title: "Refund policy",
      desc: "Shown at /refund-policy",
      href: "/admin/settings?tab=legal",
      icon: FileText,
      count: hasKey("legal.refund") ? "✓ set" : "Not set",
    },
  ];

  const groups: Tile["group"][] = [
    "Pages",
    "Site chrome",
    "Home sections",
    "Catalog",
    "Legal",
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">Content</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Edit every surface on the public site — hero, services, gallery,
          testimonials, footer, legal pages and SEO. Counts on each card are
          pulled live so you can see at a glance what&apos;s set.
        </p>
      </header>

      {groups.map((g) => {
        const items = tiles.filter((t) => t.group === g);
        if (!items.length) return null;
        return (
          <section key={g} className="space-y-3">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {g}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((t) => {
                const Icon = t.icon;
                return (
                  <Link key={t.href + t.title} href={t.href} className="group">
                    <Card className="h-full transition hover:border-primary hover:shadow-sm">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="size-9 shrink-0 rounded-lg bg-primary/10 text-primary grid place-items-center">
                          <Icon className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-sm truncate">{t.title}</div>
                            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition shrink-0" />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {t.desc}
                          </div>
                          {t.count !== undefined && (
                            <div className="text-[11px] font-mono mt-2 inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {String(t.count)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

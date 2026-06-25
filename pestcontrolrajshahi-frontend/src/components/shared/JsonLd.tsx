import { cld } from "@/lib/cloudinary";

/**
 * schema.org JSON-LD helpers. Every block is data-driven from CMS settings so
 * structured data stays in sync with what the admin edits — no hardcoded
 * business facts. Rendered as <script type="application/ld+json"> which is the
 * Google-recommended way to embed structured data.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pestcontrolrajshahi.com";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Pest Control Rajshahi";

function JsonLdScript({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // Strip the closing-tag sequence to avoid breaking out of the script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Recursively pull plain text out of a TipTap/ProseMirror doc (FAQ answers). */
export function richTextToPlain(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(richTextToPlain).join(" ");
  if (node.text) return node.text as string;
  if (node.content) return richTextToPlain(node.content);
  return "";
}

function imageUrl(publicId?: string | null): string | undefined {
  if (!publicId) return undefined;
  if (publicId.startsWith("http") || publicId.startsWith("/")) {
    return publicId.startsWith("/") ? `${SITE_URL}${publicId}` : publicId;
  }
  return cld(publicId, { w: 1200, h: 630, crop: "fill" });
}

/** Organisation + LocalBusiness — the anchor entity for local SEO. */
export function LocalBusinessJsonLd({ settings }: { settings: Record<string, any> }) {
  const contact = settings["footer.contact"] || {};
  const business = settings["business.info"] || {};
  const seo = settings["seo.default"] || {};

  const data: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: business.name || SITE_NAME,
    url: SITE_URL,
    description: seo.description || undefined,
    image: imageUrl(seo.ogImage) || `${SITE_URL}/icon.jpg`,
    telephone: contact.phone || undefined,
    email: contact.email || undefined,
    priceRange: "৳৳",
    areaServed: { "@type": "City", name: "Rajshahi" },
  };

  if (contact.address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: String(contact.address).split(",")[0]?.trim(),
      addressLocality: "Rajshahi",
      addressRegion: "Rajshahi Division",
      addressCountry: "BD",
    };
  }
  if (business.license) data.hasCredential = business.license;
  if (business.established) data.foundingDate = business.established;

  const socials = (contact.socials || [])
    .map((s: any) => s?.href)
    .filter((h: any) => typeof h === "string" && h.startsWith("http"));
  if (socials.length) data.sameAs = socials;

  return <JsonLdScript data={data} />;
}

/** WebSite entity — helps Google understand the site name in SERPs. */
export function WebSiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#business` },
      }}
    />
  );
}

/** Per-service structured data for rich results on service detail pages. */
export function ServiceJsonLd({ service }: { service: any }) {
  if (!service) return null;
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: service.name,
        description: service.shortDesc || service.seoDescription || undefined,
        image: imageUrl(service.image),
        serviceType: service.category?.name || "Pest control",
        areaServed: { "@type": "City", name: "Rajshahi" },
        provider: {
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/#business`,
          name: SITE_NAME,
          url: SITE_URL,
        },
        url: `${SITE_URL}/services/${service.slug}`,
      }}
    />
  );
}

/** FAQPage structured data — eligible for FAQ rich snippets. */
export function FaqPageJsonLd({ faqs }: { faqs: any[] }) {
  const mainEntity = (faqs || [])
    .map((f) => {
      const answer = richTextToPlain(f.answer).trim();
      if (!f.question || !answer) return null;
      return {
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      };
    })
    .filter(Boolean);
  if (!mainEntity.length) return null;
  return (
    <JsonLdScript
      data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity }}
    />
  );
}

/** BreadcrumbList — improves SERP breadcrumbs on deep pages. */
export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: it.name,
          item: `${SITE_URL}${it.path}`,
        })),
      }}
    />
  );
}

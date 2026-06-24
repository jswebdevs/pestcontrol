import type { Metadata } from "next";
import Link from "next/link";
import { serverFetch } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { Card, CardContent } from "@/components/ui/card";
import { CldImage } from "@/components/shared/CldImage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const p = settings["page.services"] || {};
  const title = p.title || "Our services";
  const description =
    p.sub ||
    "Browse every service: termite, cockroach & mosquito control, deep cleaning, sanitization and more. Eco-safe chemicals, transparent pricing, trained technicians.";
  return { title, description, alternates: { canonical: "/services" } };
}

export default async function ServicesListPage({
  searchParams,
}: {
  // Next 15+: searchParams is a Promise.
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const [settings, services, categories] = await Promise.all([
    getSettings(),
    serverFetch<any[]>(`/services${cat ? `?category=${encodeURIComponent(cat)}` : ""}`),
    serverFetch<any[]>("/service-categories"),
  ]);
  const page = settings["page.services"] || {};
  return (
    <section className="container py-16 md:py-20">
      <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
        {page.title || "Our services"}
      </h1>
      <p className="text-muted-foreground mb-8">
        {page.sub || "Safe, effective cleaning & pest control across Rajshahi."}
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/services"
          className={`px-4 py-1.5 rounded-full text-sm border transition ${
            !cat
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:border-primary"
          }`}
        >
          All
        </Link>
        {(categories || []).map((c: any) => (
          <Link
            key={c.slug}
            href={`/services?cat=${c.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${
              cat === c.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:border-primary"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {(services || []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {page.emptyMessage || "No services in this category yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(services || []).map((s: any) => (
            <Link key={s.id} href={`/services/${s.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition h-full p-0 gap-0">
                <div className="aspect-4/3 bg-muted overflow-hidden relative">
                  {s.image && (
                    <CldImage
                      publicId={s.image}
                      alt={s.name}
                      w={800}
                      h={600}
                      crop="fill"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <CardContent className="p-5 space-y-2">
                  <div className="font-heading font-semibold text-lg group-hover:text-primary transition">
                    {s.name}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.shortDesc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

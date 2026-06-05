import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api";
import { CldImage } from "@/components/shared/CldImage";
import { Card, CardContent } from "@/components/ui/card";
import { BookNowButton } from "@/components/public/BookNowButton";
import { CheckCircle2, XCircle } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await serverFetch<any>(`/services/${slug}`);
  if (!s) return {};
  return {
    title: s.seoTitle || s.name,
    description: s.seoDescription || s.shortDesc,
  };
}

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const service = preview
    ? (await serverFetch<any>(`/preview/${preview}`))?.payload
    : await serverFetch<any>(`/services/${slug}`);
  if (!service) notFound();

  const bullets: string[] = service.inclusions ?? [];

  return (
    <article className="container py-12">
      {preview && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 px-4 py-2 mb-6 text-sm font-medium">
          🔍 PREVIEW — not visible to visitors
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
        {/* Image — left */}
        <div className="aspect-square lg:aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
          {service.image ? (
            <CldImage
              publicId={service.image}
              alt={service.name}
              w={1200}
              h={1500}
              className="size-full object-cover"
            />
          ) : (
            <div className="size-full" />
          )}
        </div>

        {/* Right — title, desc, bullets, CTA */}
        <div className="space-y-5">
          {service.category?.name && (
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              {service.category.name}
            </div>
          )}
          <h1 className="font-heading text-3xl md:text-5xl font-bold leading-tight">
            {service.name}
          </h1>
          {service.shortDesc && (
            <p className="text-lg text-muted-foreground leading-relaxed">{service.shortDesc}</p>
          )}

          {bullets.length > 0 && (
            <ul className="space-y-2.5 pt-2">
              {bullets.map((b: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-base">
                  <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-4">
            <BookNowButton
              serviceSlug={service.slug}
              size="lg"
              className="rounded-full px-8 font-semibold"
            >
              Book now
            </BookNowButton>
          </div>
        </div>
      </div>

      {service.longDescHtml && (
        <Card className="mb-10">
          <CardContent
            className="prose prose-slate dark:prose-invert max-w-none p-6 md:p-8"
            dangerouslySetInnerHTML={{ __html: service.longDescHtml }}
          />
        </Card>
      )}

      {service.exclusions?.length ? (
        <Card className="mb-10">
          <CardContent className="p-6 md:p-8">
            <h3 className="font-heading font-bold text-lg mb-4">Not included</h3>
            <ul className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {service.exclusions.map((it: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" /> {it}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </article>
  );
}

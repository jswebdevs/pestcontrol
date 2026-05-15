import { notFound } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/api";
import { CldImage } from "@/components/shared/CldImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const s = await serverFetch<any>(`/services/${params.slug}`);
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
  params: { slug: string };
  searchParams: { preview?: string };
}) {
  let service = searchParams.preview
    ? (await serverFetch<any>(`/preview/${searchParams.preview}`))?.payload
    : await serverFetch<any>(`/services/${params.slug}`);
  if (!service) notFound();

  return (
    <article className="container py-12 max-w-5xl">
      {searchParams.preview && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 px-4 py-2 mb-6 text-sm font-medium">
          🔍 PREVIEW — not visible to visitors
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
          {service.image && (
            <CldImage publicId={service.image} alt={service.name} w={1200} className="size-full object-cover" />
          )}
        </div>
        <div className="space-y-5">
          <div className="text-sm text-muted-foreground font-medium">{service.category?.name}</div>
          <h1 className="font-heading text-3xl md:text-5xl font-bold leading-tight">{service.name}</h1>
          <p className="text-lg text-muted-foreground">{service.shortDesc}</p>
          {service.basePrice && (
            <div className="text-2xl font-heading font-bold">
              From <span className="text-primary">৳{Number(service.basePrice).toFixed(0)}</span>{" "}
              <span className="text-base text-muted-foreground font-normal">{service.priceUnit}</span>
            </div>
          )}
          <Button asChild size="lg" className="rounded-full">
            <Link href={`/order?service=${service.slug}`}>Book this service</Link>
          </Button>
        </div>
      </div>

      {service.longDescHtml && (
        <Card className="mb-10">
          <CardContent className="prose prose-slate max-w-none p-8" dangerouslySetInnerHTML={{ __html: service.longDescHtml }} />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {service.inclusions?.length ? (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-bold text-lg mb-4">What's included</h3>
              <ul className="space-y-2">
                {service.inclusions.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" /> {it}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        {service.exclusions?.length ? (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-heading font-bold text-lg mb-4">Not included</h3>
              <ul className="space-y-2">
                {service.exclusions.map((it: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" /> {it}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </article>
  );
}

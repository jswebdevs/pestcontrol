import Link from "next/link";
import { serverFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { CldImage } from "@/components/shared/CldImage";

export const revalidate = 60;

export default async function ServicesListPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const [services, categories] = await Promise.all([
    serverFetch<any[]>(`/services${searchParams.cat ? `?category=${searchParams.cat}` : ""}`),
    serverFetch<any[]>("/service-categories"),
  ]);
  return (
    <section className="container py-16 md:py-20">
      <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">Our services</h1>
      <p className="text-muted-foreground mb-8">Pickup, clean, deliver — all across Rajshahi.</p>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/services"
          className={`px-4 py-1.5 rounded-full text-sm border ${!searchParams.cat ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary"}`}
        >
          All
        </Link>
        {(categories || []).map((c: any) => (
          <Link
            key={c.slug}
            href={`/services?cat=${c.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm border ${searchParams.cat === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(services || []).map((s: any) => (
          <Link key={s.id} href={`/services/${s.slug}`} className="group">
            <Card className="overflow-hidden hover:shadow-lg transition h-full">
              <div className="aspect-[5/3] bg-gradient-to-br from-primary/10 to-accent/10">
                {s.image && <CldImage publicId={s.image} alt={s.name} w={640} className="size-full object-cover" />}
              </div>
              <CardContent className="p-5 space-y-2">
                <div className="font-heading font-semibold text-lg group-hover:text-primary transition">{s.name}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">{s.shortDesc}</p>
                {s.basePrice && (
                  <div className="text-sm font-medium pt-2">
                    From <span className="text-primary">৳{Number(s.basePrice).toFixed(0)}</span>{" "}
                    <span className="text-muted-foreground text-xs">{s.priceUnit}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

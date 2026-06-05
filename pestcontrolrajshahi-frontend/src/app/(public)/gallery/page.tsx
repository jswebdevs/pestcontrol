import Link from "next/link";
import { serverFetch } from "@/lib/api";
import { CldImage } from "@/components/shared/CldImage";
import { BookNowButton } from "@/components/public/BookNowButton";

export const revalidate = 60;

export const metadata = {
  title: "Gallery",
  description:
    "Photos from our cleaning and pest control work across Rajshahi — homes, restaurants, schools, hotels, hospitals.",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [items, catRows] = await Promise.all([
    serverFetch<any[]>(
      `/gallery${category ? `?category=${encodeURIComponent(category)}` : ""}`,
    ),
    serverFetch<Array<{ category: string | null }>>("/gallery/categories"),
  ]);
  const categories = Array.from(
    new Set((catRows || []).map((c) => c.category).filter(Boolean) as string[]),
  );
  const list = items || [];

  return (
    <section className="container py-16 md:py-20">
      <div className="text-center mb-10">
        <div className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          Gallery
        </div>
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3 leading-tight">
          Our work in pictures
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A look at the spaces we&apos;ve cleaned and the pests we&apos;ve sent packing. Tap any image
          for a closer look.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <Link
            href="/gallery"
            className={`cursor-pointer px-4 py-1.5 rounded-full text-sm border transition ${
              !category
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:border-primary"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/gallery?category=${encodeURIComponent(c)}`}
              className={`cursor-pointer px-4 py-1.5 rounded-full text-sm border transition capitalize ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:border-primary"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-5">
            No photos in the gallery yet. Check back soon — we&apos;re adding new work every week.
          </p>
          <BookNowButton size="lg" className="rounded-full px-7">
            Book a service
          </BookNowButton>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {list.map((g: any) => (
            <figure
              key={g.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-muted"
            >
              <CldImage
                publicId={g.image}
                alt={g.caption || "Gallery photo"}
                w={600}
                h={600}
                crop="fill"
                className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {(g.caption || g.category) && (
                <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/75 via-black/30 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {g.category && (
                    <div className="text-[10px] font-medium uppercase tracking-wider opacity-90 mb-0.5 capitalize">
                      {g.category}
                    </div>
                  )}
                  {g.caption && (
                    <div className="text-xs md:text-sm font-medium line-clamp-2">{g.caption}</div>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <div className="mt-16 rounded-3xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground p-10 md:p-14 text-center">
        <h2 className="font-heading text-2xl md:text-4xl font-bold mb-3">
          See your space here next
        </h2>
        <p className="opacity-90 max-w-xl mx-auto mb-6">
          Book a free inspection — we&apos;ll send a technician and add your before/after to the
          gallery (with permission).
        </p>
        <BookNowButton size="lg" variant="secondary" className="rounded-full px-8 font-semibold">
          Book a service
        </BookNowButton>
      </div>
    </section>
  );
}

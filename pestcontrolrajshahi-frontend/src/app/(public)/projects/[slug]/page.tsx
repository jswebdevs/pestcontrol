import { notFound } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/api";
import { CldImage } from "@/components/shared/CldImage";
import { Card, CardContent } from "@/components/ui/card";
import { BookNowButton } from "@/components/public/BookNowButton";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await serverFetch<any>(`/projects/${slug}`).catch(() => null);
  if (!p) return {};
  return {
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.summary,
  };
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const project = preview
    ? (await serverFetch<any>(`/preview/${preview}`).catch(() => null))?.payload
    : await serverFetch<any>(`/projects/${slug}`).catch(() => null);
  if (!project) notFound();

  const gallery: string[] = project.gallery ?? [];

  return (
    <article className="container py-12 max-w-5xl">
      {preview && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-200 px-4 py-2 mb-6 text-sm font-medium">
          🔍 PREVIEW — not visible to visitors
        </div>
      )}

      <div className="mb-6">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition">
          ← Back to portfolio
        </Link>
      </div>

      <div className="mb-8 space-y-3">
        {project.category && (
          <div className="text-sm text-muted-foreground font-medium">{project.category}</div>
        )}
        <h1 className="font-heading text-3xl md:text-5xl font-bold leading-tight">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {project.date && <span>{formatDate(project.date)}</span>}
          {project.client && (
            <>
              <span className="hidden sm:inline opacity-60">•</span>
              <span>Client: {project.client}</span>
            </>
          )}
        </div>
        {project.summary && (
          <p className="text-lg text-muted-foreground max-w-3xl">{project.summary}</p>
        )}
      </div>

      <div className="aspect-[16/9] rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden mb-10">
        {project.cover && (
          <CldImage publicId={project.cover} alt={project.title} w={1600} className="size-full object-cover" />
        )}
      </div>

      {project.bodyHtml && (
        <Card className="mb-10">
          <CardContent
            className="prose prose-slate dark:prose-invert max-w-none p-8"
            dangerouslySetInnerHTML={{ __html: project.bodyHtml }}
          />
        </Card>
      )}

      {gallery.length > 0 && (
        <div className="mb-12">
          <h2 className="font-heading text-2xl font-bold mb-5">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gallery.map((g, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden bg-muted"
              >
                <CldImage publicId={g} alt={`${project.title} — image ${i + 1}`} w={800} h={800} className="absolute inset-0 size-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-3xl border bg-card/40 p-8 md:p-10 text-center">
        <h3 className="font-heading text-2xl md:text-3xl font-bold mb-3">Have a pest problem?</h3>
        <p className="text-muted-foreground mb-5">
          Get the same professional treatment at your home or business.
        </p>
        <BookNowButton size="lg" className="rounded-full">
          Book a service
        </BookNowButton>
      </div>
    </article>
  );
}

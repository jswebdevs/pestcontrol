import Link from "next/link";
import { serverFetch } from "@/lib/api";
import { CldImage } from "@/components/shared/CldImage";

export const revalidate = 60;

export const metadata = {
  title: "Portfolio",
  description: "Recent pest control projects across Rajshahi.",
};

interface Project {
  id: string;
  slug: string;
  title: string;
  cover?: string;
  date?: string;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default async function ProjectsListPage() {
  const projects = await serverFetch<Project[]>("/projects").catch(() => [] as Project[]);

  return (
    <section className="container py-16 md:py-20">
      <div className="max-w-2xl mb-10">
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">Portfolio</h1>
        <p className="text-muted-foreground">
          A selection of recent pest control work across Rajshahi.
        </p>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="rounded-2xl border bg-card/40 p-12 text-center text-sm text-muted-foreground">
          No projects yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
            >
              {p.cover ? (
                <CldImage
                  publicId={p.cover}
                  alt={p.title}
                  w={800}
                  h={600}
                  className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <h3 className="font-heading font-bold text-lg leading-tight">{p.title}</h3>
                {p.date && (
                  <p className="text-xs mt-1 opacity-90">{formatDate(p.date)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

import Link from "next/link";
import * as LIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CldImage } from "@/components/shared/CldImage";
import { BookNowButton } from "@/components/public/BookNowButton";

function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const pascalName = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  // @ts-expect-error dynamic lookup
  const Cmp = LIcons[pascalName] || LIcons[name as any] || LIcons.Sparkles;
  return <Cmp className={className} />;
}

export function About({ about }: { about: any }) {
  if (!about) return null;
  const allParas: string[] = ((about.body?.content || []) as any[])
    .filter((n) => n.type === "paragraph")
    .map((n) => (n.content || []).map((c: any) => c.text).join(""))
    .filter(Boolean);
  // Keep the right column trimmed to roughly match the left image's height.
  // 2 paragraphs is a reasonable visual budget for a hero-style About block;
  // anything beyond gets truncated with an ellipsis and a Read more link.
  const visible = allParas.slice(0, 2);
  const hasMore = allParas.length > visible.length;

  return (
    <section className="py-20 md:py-28">
      <div className="container grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 lg:gap-12 items-stretch">
        {/* Left — image fills the column at portrait aspect */}
        <div className="rounded-3xl overflow-hidden bg-muted/40 aspect-4/5 lg:aspect-auto lg:min-h-[520px] relative">
          <CldImage
            publicId={about.image}
            alt={about.title || "About"}
            w={1200}
            h={1500}
            className="absolute inset-0 size-full object-cover"
          />
        </div>

        {/* Right — content stays inside one column, ends with Read more */}
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-3xl md:text-4xl font-bold leading-tight">
            {about.title}
          </h2>
          {visible.map((text, i) => {
            const isLast = i === visible.length - 1;
            const display = isLast && hasMore ? text.replace(/[\s.]*$/, " …") : text;
            return (
              <p key={i} className="text-muted-foreground leading-relaxed">
                {display}
              </p>
            );
          })}

          {/* 3 pillars stacked vertically inside the right column */}
          {about.stats?.length ? (
            <ul className="space-y-2.5 pt-1">
              {about.stats.slice(0, 3).map((s: any, i: number) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border bg-card px-4 py-3"
                >
                  <span className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center font-heading font-bold shrink-0 text-sm">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-heading font-semibold text-sm leading-tight">
                      {s.value}
                    </div>
                    {s.label && (
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {s.label}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-auto pt-4">
            <Button asChild size="lg" className="rounded-full px-7 font-semibold">
              <Link href="/about">Read more about us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustBadges({ badges }: { badges: any[] }) {
  if (!badges?.length) return null;
  return (
    <section className="py-10 md:py-12 bg-card/40 border-y">
      <div className="container grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map((b: any, i: number) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border bg-card">
            <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center">
              <Icon name={b.icon} className="size-5" />
            </div>
            <span className="font-medium text-sm">{b.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ServiceCards({ services, title, sub }: { services: any[]; title?: string; sub?: string }) {
  if (!services?.length) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">{title || "Our Services"}</h2>
          {sub && <p className="text-muted-foreground max-w-2xl mx-auto">{sub}</p>}
        </div>
        {/* Homepage shows 6 services = 2 rows × 3 cols on desktop. Full catalog at /services. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.slice(0, 6).map((s: any) => (
            <Link key={s.id} href={`/services/${s.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition border-border/60 h-full p-0 gap-0">
                {/* Fixed 4:3 image well so every card has the same image height */}
                <div className="aspect-4/3 bg-muted overflow-hidden relative">
                  <CldImage
                    publicId={s.image}
                    alt={s.name}
                    w={800}
                    h={600}
                    crop="fill"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
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
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link href="/services">View all services</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ howItWorks }: { howItWorks: any }) {
  if (!howItWorks?.steps?.length) return null;
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">
          {howItWorks.title || "How it works"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.steps.map((step: any, i: number) => (
            <div key={i} className="relative">
              <div className="bg-card rounded-2xl border p-6 h-full">
                <div className="size-12 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-4">
                  <Icon name={step.icon} className="size-6" />
                </div>
                <div className="font-heading font-semibold text-lg mb-2">{step.title}</div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
              {i < howItWorks.steps.length - 1 && (
                <div className="hidden lg:grid absolute top-12 -right-3 size-6 rounded-full bg-primary text-primary-foreground place-items-center text-xs font-bold">
                  {i + 2}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyChooseUs({ whyChooseUs }: { whyChooseUs: any }) {
  if (!whyChooseUs?.points?.length) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">{whyChooseUs.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.points.map((point: any, i: number) => (
            <div key={i} className="text-center p-6 rounded-2xl border bg-card">
              <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 grid place-items-center mx-auto mb-4">
                <Icon name={point.icon} className="size-6" />
              </div>
              <div className="font-heading font-semibold mb-2">{point.title}</div>
              <p className="text-sm text-muted-foreground">{point.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials({
  testimonials,
  title,
  facebookUrl,
}: {
  testimonials: any[];
  title?: string;
  facebookUrl?: string;
}) {
  if (!testimonials?.length) return null;
  // If we have a real Facebook page URL, link to its /reviews tab so visitors
  // can verify the sample reviews against the live page.
  const reviewsUrl = facebookUrl
    ? facebookUrl.replace(/\/+$/, '') + '/reviews'
    : null;
  return (
    <section className="bg-muted/30 py-20 md:py-28">
      <div className="container">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12">
          {title || "What our customers say"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((t: any) => (
            <Card key={t.id} className="p-6 bg-card">
              <div className="flex gap-0.5 mb-3 text-amber-500">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4">"{t.body}"</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/15 text-primary grid place-items-center font-bold">
                  {t.name?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
                </div>
              </div>
            </Card>
          ))}
        </div>
        {reviewsUrl && (
          <div className="mt-10 text-center">
            <a
              href={reviewsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
              </svg>
              Read more reviews on Facebook
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export function FinalCTA({ cta }: { cta: any }) {
  if (!cta) return null;
  const label = cta.cta?.label || "Book now";
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="rounded-3xl p-10 md:p-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-center relative overflow-hidden">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">{cta.title}</h2>
          {cta.sub && <p className="text-lg opacity-90 max-w-xl mx-auto mb-6">{cta.sub}</p>}
          <BookNowButton size="lg" variant="secondary" className="rounded-full px-8">
            {label}
          </BookNowButton>
        </div>
      </div>
    </section>
  );
}

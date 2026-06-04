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
  return (
    <section className="py-20 md:py-28">
      <div className="container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="rounded-3xl overflow-hidden">
            <CldImage
              publicId={about.image}
              alt={about.title || "About image"}
              w={1200}
              h={960}
              className="size-full object-cover rounded-3xl"
            />
          </div>
        </div>
        <div className="space-y-6">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">{about.title}</h2>
          {about.body?.content?.map?.((node: any, i: number) => {
            if (node.type === "paragraph") {
              return (
                <p key={i} className="text-muted-foreground leading-relaxed">
                  {node.content?.map?.((c: any) => c.text).join("")}
                </p>
              );
            }
            return null;
          })}
          {about.stats?.length ? (
            <div className="grid grid-cols-3 gap-4 pt-4">
              {about.stats.map((s: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="font-heading text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          ) : null}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.slice(0, 9).map((s: any) => (
            <Link key={s.id} href={`/services/${s.slug}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition border-border/60 h-full">
                <CldImage publicId={s.image} alt={s.name} w={640} h={384} className="size-full object-cover" />
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
              <div className="size-14 rounded-full bg-accent/15 text-accent-foreground grid place-items-center mx-auto mb-4">
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

export function Testimonials({ testimonials, title }: { testimonials: any[]; title?: string }) {
  if (!testimonials?.length) return null;
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

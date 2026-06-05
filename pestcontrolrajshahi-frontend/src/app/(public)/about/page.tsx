import { getSettings } from "@/lib/settings";
import { CldImage } from "@/components/shared/CldImage";
import { BookNowButton } from "@/components/public/BookNowButton";
import { ShieldCheck, Users, BadgeCheck, Sparkles } from "lucide-react";

export const revalidate = 60;

export async function generateMetadata() {
  const settings = await getSettings();
  const a = settings["page.about"] || {};
  return {
    title: a.heading || "About us",
    description: a.subheading || "",
  };
}

const FALLBACK_ICONS = [ShieldCheck, Users, BadgeCheck, Sparkles];

export default async function AboutPage() {
  const settings = await getSettings();
  const a = settings["page.about"] || {};
  const homeAbout = settings["home.about"] || {};
  const heroImage = homeAbout.image || a.image;
  const paragraphs: string[] = Array.isArray(a.paragraphs) ? a.paragraphs : [];
  const pillars: Array<{ title: string; body: string }> = Array.isArray(a.pillars)
    ? a.pillars
    : [];

  return (
    <article>
      {/* Hero */}
      <section className="bg-muted/30 border-b">
        <div className="container py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-12 items-center">
          <div className="space-y-5">
            <div className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary">
              About us
            </div>
            <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {a.heading || "About Pest Control Rajshahi"}
            </h1>
            {a.subheading && (
              <p className="text-lg text-muted-foreground max-w-prose leading-relaxed">
                {a.subheading}
              </p>
            )}
            <div className="pt-2">
              <BookNowButton size="lg" className="rounded-full px-7 font-semibold">
                Book a service
              </BookNowButton>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-muted aspect-square lg:aspect-4/5 relative">
            <CldImage
              publicId={heroImage}
              alt={a.heading || "Pest Control Rajshahi team"}
              w={1200}
              h={1500}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Body paragraphs */}
      {paragraphs.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container max-w-3xl space-y-6">
            {paragraphs.map((text, i) => (
              <p
                key={i}
                className="text-base md:text-lg text-foreground/85 leading-relaxed"
              >
                {text}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Pillars */}
      {pillars.length > 0 && (
        <section className="bg-muted/30 border-y py-16 md:py-20">
          <div className="container">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-10">
              What sets us apart
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pillars.map((p, i) => {
                const Icon = FALLBACK_ICONS[i % FALLBACK_ICONS.length];
                return (
                  <div
                    key={i}
                    className="bg-card rounded-2xl border p-6 flex flex-col gap-3"
                  >
                    <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 grid place-items-center">
                      <Icon className="size-5" />
                    </div>
                    <div className="font-heading font-semibold leading-tight">{p.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="rounded-3xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground p-10 md:p-14 text-center">
            <h2 className="font-heading text-2xl md:text-4xl font-bold mb-3">
              Ready to make your property pest-free?
            </h2>
            <p className="opacity-90 max-w-xl mx-auto mb-6">
              Free inspection, transparent pricing, eco-conscious treatments. Book your slot in
              under a minute.
            </p>
            <BookNowButton
              size="lg"
              variant="secondary"
              className="rounded-full px-8 font-semibold"
            >
              Book now
            </BookNowButton>
          </div>
        </div>
      </section>
    </article>
  );
}

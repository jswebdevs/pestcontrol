import { serverFetch } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { BookNowButton } from "@/components/public/BookNowButton";
import { FaqPageJsonLd } from "@/components/shared/JsonLd";

export const revalidate = 120;

export const metadata = {
  title: "Frequently Asked Questions",
  description: "Quick answers about our cleaning and pest-control services in Rajshahi.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([
    serverFetch<any[]>("/faqs"),
    getSettings(),
  ]);
  const page = settings["page.faq"] || {};
  return (
    <section className="container max-w-4xl py-16 md:py-20">
      <FaqPageJsonLd faqs={faqs || []} />
      <div className="mb-10 text-center">
        <div className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          FAQ
        </div>
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3 leading-tight">
          {page.title || "Frequently asked questions"}
        </h1>
        <p className="text-muted-foreground">
          {page.sub ||
            "Quick answers to common questions. Don’t see yours? Reach out — we’re happy to help."}
        </p>
      </div>

      <FaqAccordion items={faqs || []} />

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-3">Still have questions?</p>
        <BookNowButton size="lg" className="rounded-full px-7 font-semibold">
          Book a service
        </BookNowButton>
      </div>
    </section>
  );
}

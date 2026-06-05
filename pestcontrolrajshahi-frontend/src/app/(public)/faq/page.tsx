import { serverFetch } from "@/lib/api";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { BookNowButton } from "@/components/public/BookNowButton";

export const revalidate = 120;

export const metadata = {
  title: "Frequently Asked Questions",
  description: "Quick answers about our cleaning and pest-control services in Rajshahi.",
};

export default async function FaqPage() {
  const faqs = await serverFetch<any[]>("/faqs");
  return (
    <section className="container max-w-4xl py-16 md:py-20">
      <div className="mb-10 text-center">
        <div className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          FAQ
        </div>
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3 leading-tight">
          Frequently asked questions
        </h1>
        <p className="text-muted-foreground">
          Quick answers to common questions. Don&apos;t see yours? Reach out — we&apos;re happy to help.
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

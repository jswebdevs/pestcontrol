import { getSettings } from "@/lib/settings";
import { serverFetch } from "@/lib/api";
import { Hero } from "@/components/public/Hero";
import {
  About,
  TrustBadges,
  ServiceCards,
  HowItWorks,
  WhyChooseUs,
  Testimonials,
  FinalCTA,
} from "@/components/public/Sections";

export default async function HomePage() {
  const [settings, services, testimonials] = await Promise.all([
    getSettings(),
    // Fetch ALL published services (not just featured) so we can always fill
    // the 6-card grid even if the curator hasn't flagged enough as featured.
    serverFetch<any[]>("/services", { revalidate: 60 }),
    serverFetch<any[]>("/testimonials", { revalidate: 120 }),
  ]);

  // Featured first, then fill with the rest by order. Always cap at 6 cards
  // for the homepage (2 rows × 3 cols on desktop).
  const featured = (services || []).filter((s: any) => s.featured);
  const others = (services || []).filter((s: any) => !s.featured);
  const serviceList = [...featured, ...others].slice(0, 6);

  return (
    <>
      <Hero slides={settings["home.hero"]?.slides || []} />
      <TrustBadges badges={settings["home.trustBadges"]?.badges || []} />
      <About about={settings["home.about"]} />
      <ServiceCards
        services={serviceList}
        title={settings["home.serviceCards"]?.title}
        sub={settings["home.serviceCards"]?.sub}
      />
      <HowItWorks howItWorks={settings["home.howItWorks"]} />
      <WhyChooseUs whyChooseUs={settings["home.whyChooseUs"]} />
      <Testimonials testimonials={testimonials || []} title={settings["home.testimonials"]?.title} />
      <FinalCTA cta={settings["home.finalCta"]} />
    </>
  );
}

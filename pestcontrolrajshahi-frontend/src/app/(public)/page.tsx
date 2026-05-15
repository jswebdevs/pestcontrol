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
    serverFetch<any[]>("/services?featured=true", { revalidate: 60 }),
    serverFetch<any[]>("/testimonials", { revalidate: 120 }),
  ]);

  const featured = (services || []).filter((s: any) => s.featured);
  const serviceList = featured.length ? featured : services || [];

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

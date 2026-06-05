import { getSettings } from "@/lib/settings";
import { LegalPolicy } from "@/components/public/LegalPolicy";

export const revalidate = 60;

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Terms governing your use of Pest Control Rajshahi cleaning and pest-control services in Bangladesh.",
};

export default async function TermsPage() {
  const settings = await getSettings();
  return (
    <LegalPolicy value={settings["legal.terms"]} fallbackHeading="Terms & Conditions" />
  );
}

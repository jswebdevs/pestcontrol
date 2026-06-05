import { getSettings } from "@/lib/settings";
import { LegalPolicy } from "@/components/public/LegalPolicy";

export const revalidate = 60;

export const metadata = {
  title: "Refund Policy",
  description:
    "Refund and re-treatment guarantee for Pest Control Rajshahi customers, with bKash / Nagad / bank refund options.",
};

export default async function RefundPolicyPage() {
  const settings = await getSettings();
  return (
    <LegalPolicy value={settings["legal.refund"]} fallbackHeading="Refund Policy" />
  );
}

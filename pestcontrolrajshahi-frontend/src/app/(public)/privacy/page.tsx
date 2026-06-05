import { getSettings } from "@/lib/settings";
import { LegalPolicy } from "@/components/public/LegalPolicy";

export const revalidate = 60;

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Pest Control Rajshahi collects, uses, and protects your personal information in compliance with Bangladesh law.",
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <LegalPolicy value={settings["legal.privacy"]} fallbackHeading="Privacy Policy" />
  );
}

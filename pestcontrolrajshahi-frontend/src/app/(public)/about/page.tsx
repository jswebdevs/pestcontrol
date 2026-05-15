import { getSettings } from "@/lib/settings";
import { About } from "@/components/public/Sections";

export const revalidate = 60;

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div>
      <About about={settings["home.about"]} />
    </div>
  );
}

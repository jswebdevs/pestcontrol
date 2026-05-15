import { getSettings } from "@/lib/settings";
import { serverFetch } from "@/lib/api";
import { Header, type NavService, type NavProject } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, services, projects] = await Promise.all([
    getSettings(),
    serverFetch<NavService[]>("/services", { revalidate: 60, tag: "services" }),
    serverFetch<NavProject[]>("/projects", { revalidate: 60, tag: "projects" }),
  ]);

  return (
    <div className="min-h-dvh flex flex-col">
      <Header
        header={settings["home.header"] || {}}
        services={services || []}
        projects={projects || []}
      />
      <main className="flex-1">{children}</main>
      <Footer
        contact={settings["footer.contact"] || {}}
        columns={settings["footer.columns"] || {}}
      />
    </div>
  );
}

import { getSettings } from "@/lib/settings";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { BookingProvider } from "@/components/public/BookingModal";
import { LocalBusinessJsonLd, WebSiteJsonLd } from "@/components/shared/JsonLd";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <BookingProvider>
      <LocalBusinessJsonLd settings={settings} />
      <WebSiteJsonLd />
      <div className="min-h-dvh flex flex-col">
        <Header header={settings["home.header"] || {}} />
        <main className="flex-1">{children}</main>
        <Footer
          contact={settings["footer.contact"] || {}}
          columns={settings["footer.columns"] || {}}
          headerLogo={settings["home.header"]?.logo ?? undefined}
        />
      </div>
    </BookingProvider>
  );
}

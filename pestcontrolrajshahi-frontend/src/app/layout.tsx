import type { Metadata } from "next";
import "./globals.css";
import { getSettings, buildThemeCss, fontHref } from "@/lib/settings";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seo = settings["seo.default"] ?? {};
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pest Control Rajshahi";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pestcontrolrajshahi.com";
  const title = seo.title || siteName;
  const description =
    seo.description ||
    "Licensed cleaning & pest control in Rajshahi — termite, cockroach & mosquito treatment, deep cleaning, eco-safe chemicals, same-day service.";
  const ogImage = seo.ogImage || "/icon.jpg";

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s · ${siteName}` },
    description,
    applicationName: siteName,
    keywords:
      seo.keywords ||
      "pest control Rajshahi, termite control, cockroach control, mosquito control, deep cleaning, sanitization, eco-safe pest control",
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: siteUrl,
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: [{ url: "/icon.jpg", type: "image/jpeg" }],
      shortcut: "/icon.jpg",
      apple: "/icon.jpg",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const typography = settings["theme.typography"] || {};
  const lang = settings["seo.default"]?.lang || "en";
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href={fontHref(typography.headingFont || "Plus Jakarta Sans", typography.bodyFont || "Inter")}
        />
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss(settings) }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

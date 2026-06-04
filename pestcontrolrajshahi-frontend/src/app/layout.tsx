import type { Metadata } from "next";
import "./globals.css";
import { getSettings, buildThemeCss, fontHref } from "@/lib/settings";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seo = settings["seo.default"] ?? {};
  return {
    title: seo.title || process.env.NEXT_PUBLIC_SITE_NAME || "Pest Control Rajshahi",
    description: seo.description || "",
    icons: { icon: "/favicon.ico" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const typography = settings["theme.typography"] || {};
  return (
    <html lang="en">
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

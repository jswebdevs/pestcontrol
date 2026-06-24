import { getSettings } from "@/lib/settings";
import { Card, CardContent } from "@/components/ui/card";
import { BookNowButton } from "@/components/public/BookNowButton";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export const metadata = {
  title: "Contact",
  description: "Reach us by phone, email, or visit the office. Map and address inside.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const contact = settings["footer.contact"] || {};
  const page = settings["page.contact"] || {};

  return (
    <section className="container py-16 md:py-20">
      <div className="max-w-2xl mb-10">
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-3">
          {page.title || "Get in touch"}
        </h1>
        <p className="text-muted-foreground">
          {page.sub ||
            "Reach us by phone, email, or stop by the office. To request a service, use the booking button."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 md:gap-8">
        <Card>
          <CardContent className="p-6 md:p-8 space-y-5">
            <h2 className="font-heading font-bold text-xl">Contact details</h2>
            <ul className="space-y-4 text-sm">
              {contact.phone && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Phone className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Phone</div>
                    <a href={`tel:${contact.phone}`} className="font-medium hover:text-primary transition">
                      {contact.phone}
                    </a>
                  </div>
                </li>
              )}
              {contact.email && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Mail className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Email</div>
                    <a href={`mailto:${contact.email}`} className="font-medium hover:text-primary transition break-all">
                      {contact.email}
                    </a>
                  </div>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <MapPin className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Address</div>
                    <div className="font-medium">{contact.address}</div>
                  </div>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 size-9 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Clock className="size-4" />
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Hours</div>
                    <div className="font-medium">{contact.hours}</div>
                  </div>
                </li>
              )}
            </ul>

            <div className="pt-2 border-t">
              <BookNowButton size="lg" className="rounded-full px-8 w-full sm:w-auto">
                Book a service
              </BookNowButton>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0 h-full">
            {contact.mapEmbedUrl ? (
              <iframe
                src={contact.mapEmbedUrl}
                title="Office location"
                className="w-full h-full min-h-[360px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full min-h-[360px] grid place-items-center text-sm text-muted-foreground p-8 text-center">
                {contact.address
                  ? `Visit us at ${contact.address}.`
                  : "Find us in Rajshahi — call or email for directions."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

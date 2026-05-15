import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import * as LIcons from "lucide-react";

const socialIcon: Record<string, any> = {
  facebook: (LIcons as any).Facebook,
  instagram: (LIcons as any).Instagram,
};

export function Footer({ contact, columns }: { contact: any; columns: any }) {
  const cols = columns?.columns || [];
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Friends Laundry BD";
  return (
    <footer className="border-t mt-16 bg-muted/30">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="font-heading font-bold text-xl mb-3">{siteName}</div>
          <p className="text-sm text-muted-foreground">
            {contact?.hours && (
              <span className="flex items-center gap-2 mb-2">
                <Clock className="size-4" /> {contact.hours}
              </span>
            )}
          </p>
          <div className="flex gap-3 mt-4">
            {(contact?.socials || []).map((s: any) => {
              const Icon = socialIcon[s.icon];
              if (!Icon) return null;
              return (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="size-9 rounded-full bg-background border grid place-items-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-1">
          <h4 className="font-heading font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            {contact?.phone && (
              <li className="flex items-start gap-2">
                <Phone className="size-4 mt-0.5 shrink-0" /> {contact.phone}
              </li>
            )}
            {contact?.email && (
              <li className="flex items-start gap-2">
                <Mail className="size-4 mt-0.5 shrink-0" /> {contact.email}
              </li>
            )}
            {contact?.address && (
              <li className="flex items-start gap-2">
                <MapPin className="size-4 mt-0.5 shrink-0" /> {contact.address}
              </li>
            )}
          </ul>
        </div>
        {cols.map((col: any, idx: number) => (
          <div key={idx}>
            <h4 className="font-heading font-semibold mb-3">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {(col.links || []).map((l: any) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="container py-4 text-xs text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

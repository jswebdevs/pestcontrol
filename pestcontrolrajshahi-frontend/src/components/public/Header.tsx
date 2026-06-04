"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CldImage } from "@/components/shared/CldImage";
import { useBooking } from "@/components/public/BookingModal";

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  header: {
    logo?: string;
    topBar?: { phone?: string; text?: string };
    nav?: NavItem[];
  };
}

const FALLBACK_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Portfolio", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

export function Header({ header }: HeaderProps) {
  const nav: NavItem[] = header?.nav?.length ? header.nav : FALLBACK_NAV;
  const topBar = header?.topBar;
  const logoPublicId = header?.logo;
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pest Control Rajshahi";

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { open: openBooking } = useBooking();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {(topBar?.phone || topBar?.text) && (
        <div className="bg-primary text-primary-foreground text-xs md:text-sm">
          <div className="container flex items-center justify-between py-1.5">
            {topBar.phone ? (
              <a href={`tel:${topBar.phone}`} className="flex items-center gap-2 font-medium">
                <Phone className="size-3.5" />
                <span>{topBar.phone}</span>
              </a>
            ) : (
              <span />
            )}
            {topBar.text && <span className="hidden sm:block opacity-90">{topBar.text}</span>}
          </div>
        </div>
      )}

      <div
        className={`bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 border-b transition-shadow ${
          scrolled ? "shadow-[0_4px_30px_-12px_rgb(0_0_0_/_0.15)]" : ""
        }`}
      >
        <div className="container flex h-16 md:h-20 items-center justify-between gap-4">
          <Brand siteName={siteName} logoPublicId={logoPublicId} />

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => openBooking()}
              className="hidden md:inline-flex rounded-full px-6 font-semibold shadow-sm"
            >
              Book Now
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -mr-1" aria-label="Open menu">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[380px] p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="px-5 py-5 border-b flex flex-row items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                      <Brand siteName={siteName} logoPublicId={logoPublicId} hideTextOnMobile={false} />
                    </SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" aria-label="Close menu">
                        <X className="size-5" />
                      </Button>
                    </SheetClose>
                  </SheetHeader>

                  <nav className="flex-1 overflow-y-auto px-2 py-4">
                    {nav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="border-t p-4 space-y-3">
                    {topBar?.phone && (
                      <a
                        href={`tel:${topBar.phone}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-medium"
                      >
                        <Phone className="size-4" /> {topBar.phone}
                      </a>
                    )}
                    <Button
                      size="lg"
                      className="w-full rounded-full font-semibold"
                      onClick={() => {
                        setOpen(false);
                        openBooking();
                      }}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function Brand({
  siteName,
  logoPublicId,
  hideTextOnMobile = true,
}: {
  siteName: string;
  logoPublicId?: string;
  hideTextOnMobile?: boolean;
}) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {logoPublicId ? (
        <CldImage publicId={logoPublicId} alt={siteName} w={56} h={56} crop="fit" className="h-10 w-auto object-contain" />
      ) : (
        <span className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground font-heading font-extrabold grid place-items-center shadow-sm ring-1 ring-primary/20">
          <span className="relative z-10 text-base">PCR</span>
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-white/0" />
        </span>
      )}
      <span
        className={`font-heading text-lg font-bold tracking-tight ${hideTextOnMobile ? "hidden sm:inline" : ""}`}
      >
        {siteName}
      </span>
    </Link>
  );
}

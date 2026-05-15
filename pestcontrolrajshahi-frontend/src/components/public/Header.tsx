"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Phone, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Logo } from "./Logo";

export interface NavService {
  id: string;
  slug: string;
  name: string;
  category?: { name?: string; slug?: string } | null;
}

export interface NavProject {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
}

interface HeaderProps {
  header: {
    logo?: string;
    topBar?: { phone?: string; text?: string };
    nav?: Array<{ label: string; href: string }>;
  };
  services?: NavService[];
  projects?: NavProject[];
}

const FIXED_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];
const TAIL_NAV = [
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Header({ header, services = [], projects = [] }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phone = header?.topBar?.phone;
  const topText = header?.topBar?.text;
  const logoPublicId = header?.logo;
  const groupedServices = groupByCategory(services);

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar: phone + tagline on desktop, phone only on mobile */}
      <div className="bg-primary text-primary-foreground text-xs md:text-sm">
        <div className="container flex items-center justify-between py-1.5">
          <a href={`tel:${phone || ""}`} className="flex items-center gap-2 font-medium">
            <Phone className="size-3.5" />
            <span>{phone}</span>
          </a>
          {topText && <div className="hidden sm:block opacity-90">{topText}</div>}
        </div>
      </div>

      {/* Main bar — glass blur + subtle shadow when scrolled */}
      <div
        className={`bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 transition-shadow border-b ${
          scrolled ? "shadow-[0_4px_30px_-12px_rgb(0_0_0_/_0.15)]" : ""
        }`}
      >
        <div className="container">
          {/* Desktop layout */}
          <div className="hidden md:flex h-20 items-center justify-between gap-6">
            <Logo publicId={logoPublicId} size="md" alt="Pest Control Rajshahi" />

            <nav className="flex items-center gap-1">
              {FIXED_NAV.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}

              <ServicesDropdown services={services} grouped={groupedServices} />
              <ProjectsDropdown projects={projects} />

              {TAIL_NAV.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild size="lg" className="rounded-full px-6 font-semibold shadow-sm">
                <Link href="/order">Book Now</Link>
              </Button>
            </div>
          </div>

          {/* Mobile layout — hamburger | logo (center) | book now */}
          <div className="md:hidden relative flex h-16 items-center justify-between">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2" aria-label="Open menu">
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[380px] p-0">
                <MobileDrawer
                  header={header}
                  services={services}
                  projects={projects}
                  onClose={() => setDrawerOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo publicId={logoPublicId} size="sm" alt="Pest Control Rajshahi" />
            </div>

            <Button asChild size="sm" className="rounded-full font-semibold">
              <Link href="/order">Book Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────── Sub-components ───────────────────

function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-md transition-colors"
    >
      {label}
    </Link>
  );
}

function ServicesDropdown({
  services,
  grouped,
}: {
  services: NavService[];
  grouped: Array<{ name: string; slug?: string; items: NavService[] }>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-md transition-colors data-[state=open]:text-foreground">
          Services <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[480px] p-2">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground px-2 py-1.5">
          What we do
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-2 gap-1 p-1">
          {grouped.length === 0 ? (
            <DropdownMenuItem disabled>No services yet</DropdownMenuItem>
          ) : (
            grouped.slice(0, 6).map((group) => (
              <div key={group.name} className="px-2 py-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                  {group.name}
                </div>
                <ul className="space-y-0.5">
                  {group.items.slice(0, 4).map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/services/${s.slug}`}
                        className="block text-sm text-foreground/80 hover:text-foreground py-1 rounded transition-colors"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/services" className="font-medium text-primary justify-center">
            View all services →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectsDropdown({ projects }: { projects: NavProject[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-md transition-colors data-[state=open]:text-foreground">
          Projects <ChevronDown className="size-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground px-2 py-1.5">
          Recent work
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.length === 0 ? (
          <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
        ) : (
          projects.slice(0, 6).map((p) => (
            <DropdownMenuItem key={p.id} asChild>
              <Link href={`/projects/${p.slug}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{p.title}</span>
                  {p.category && (
                    <span className="text-xs text-muted-foreground">{p.category}</span>
                  )}
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects" className="font-medium text-primary justify-center">
            View all projects →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileDrawer({
  header,
  services,
  projects,
  onClose,
}: {
  header: HeaderProps["header"];
  services: NavService[];
  projects: NavProject[];
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-5 py-5 border-b">
        <div className="flex items-center justify-between">
          <Logo publicId={header?.logo} size="md" alt="Pest Control Rajshahi" />
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close menu">
              <X className="size-5" />
            </Button>
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <nav className="px-2 py-4">
          {FIXED_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block px-3 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}

          <MobileGroup label="Services" allHref="/services" onClose={onClose}>
            {services.slice(0, 8).map((s) => (
              <Link
                key={s.id}
                href={`/services/${s.slug}`}
                onClick={onClose}
                className="block px-3 py-2 text-sm text-foreground/80 hover:text-foreground rounded transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </MobileGroup>

          <MobileGroup label="Projects" allHref="/projects" onClose={onClose}>
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No projects yet</p>
            ) : (
              projects.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  onClick={onClose}
                  className="block px-3 py-2 text-sm text-foreground/80 hover:text-foreground rounded transition-colors"
                >
                  {p.title}
                </Link>
              ))
            )}
          </MobileGroup>

          {TAIL_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block px-3 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
        {header?.topBar?.phone && (
          <a
            href={`tel:${header.topBar.phone}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-medium"
          >
            <Phone className="size-4" /> {header.topBar.phone}
          </a>
        )}
        <Button asChild size="lg" className="w-full rounded-full font-semibold">
          <Link href="/order" onClick={onClose}>
            Book Now
          </Link>
        </Button>
      </div>
    </div>
  );
}

function MobileGroup({
  label,
  allHref,
  onClose,
  children,
}: {
  label: string;
  allHref: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pl-3 pb-2 pt-1 border-l-2 border-primary/30 ml-3">
          {children}
          <Link
            href={allHref}
            onClick={onClose}
            className="block px-3 py-2 text-sm font-medium text-primary"
          >
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─────────────── helpers ───────────────────

function groupByCategory(services: NavService[]) {
  const map = new Map<string, { name: string; slug?: string; items: NavService[] }>();
  for (const s of services) {
    const key = s.category?.slug || s.category?.name || "other";
    const name = s.category?.name || "Other";
    if (!map.has(key)) map.set(key, { name, slug: s.category?.slug, items: [] });
    map.get(key)!.items.push(s);
  }
  return Array.from(map.values());
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/auth/admin";
import {
  LayoutDashboard,
  ListOrdered,
  Briefcase,
  MessageSquare,
  HelpCircle,
  Image as ImageIcon,
  Images,
  Users as UsersIcon,
  Send,
  Settings as SettingsIcon,
  LayoutGrid,
  User,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/content", label: "Content", icon: LayoutGrid },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquare },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/invites", label: "Invites", icon: Send },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { href: "/admin/profile", label: "Profile", icon: User },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return (
    <div className="min-h-dvh grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-card hidden md:flex flex-col">
        <div className="px-5 py-4 border-b">
          <Link href="/admin" className="font-heading font-bold text-lg">
            Admin
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition"
              >
                <Icon className="size-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/admin-logout" method="POST" className="p-3 border-t">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </aside>
      <main className="bg-muted/30">
        <header className="bg-background border-b sticky top-0 z-20">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="font-heading font-bold">{process.env.NEXT_PUBLIC_SITE_NAME} · Admin</div>
            <div className="text-sm text-muted-foreground">{session?.name}</div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

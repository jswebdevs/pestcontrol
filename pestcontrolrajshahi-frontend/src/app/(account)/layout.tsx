import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerSession } from "@/lib/auth/customer";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/public/Header";
import { LayoutDashboard, ListOrdered, User, LogOut } from "lucide-react";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/login?next=/account");
  }
  const settings = await getSettings();
  return (
    <div className="min-h-dvh flex flex-col">
      <Header header={settings["home.header"] || {}} />
      <div className="container py-8 flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <aside className="space-y-1">
          <div className="px-3 pb-2 mb-2 border-b">
            <div className="text-xs text-muted-foreground">Signed in as</div>
            <div className="font-medium truncate">{session.name || session.email || session.phone}</div>
          </div>
          <NavLink href="/account" icon={<LayoutDashboard className="size-4" />} label="Dashboard" />
          <NavLink href="/account/orders" icon={<ListOrdered className="size-4" />} label="Orders" />
          <NavLink href="/account/profile" icon={<User className="size-4" />} label="Profile" />
          <form action="/api/customer-logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full text-left text-destructive hover:bg-destructive/10 transition"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition"
    >
      {icon} {label}
    </Link>
  );
}

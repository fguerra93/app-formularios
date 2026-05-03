"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { signOut } from "@/lib/auth-client";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { User, Package, Heart, Star, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/mi-cuenta", label: "Mi Perfil", icon: User, exact: true },
  { href: "/mi-cuenta/pedidos", label: "Mis Pedidos", icon: Package, exact: false },
  { href: "/mi-cuenta/favoritos", label: "Mis Favoritos", icon: Heart, exact: false },
  { href: "/mi-cuenta/reviews", label: "Mis Reviews", icon: Star, exact: false },
];

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, cliente, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 text-[#1B2A6B] animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentLabel = navItems.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href) && !item.exact
  )?.label || "Mi Perfil";

  const breadcrumbItems =
    currentLabel === "Mi Perfil"
      ? [{ label: "Mi Cuenta" }]
      : [{ label: "Mi Cuenta", href: "/mi-cuenta" }, { label: currentLabel }];

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (item: typeof navItems[number]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E293B]" style={{ letterSpacing: "-0.02em" }}>
            Hola, {cliente?.nombre || "Usuario"}!
          </h1>
          <p className="text-sm text-[#64748B] mt-1">{user.email}</p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-fit"
        >
          <LogOut className="size-4" />
          Cerrar sesion
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden sticky top-20">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-l-3 ${
                    active
                      ? "bg-[#F0F7FF] text-[#1B2A6B] border-l-[#1B2A6B]"
                      : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50 border-l-transparent"
                  }`}
                >
                  <item.icon className={`size-4 ${active ? "text-[#1B2A6B]" : "text-[#94A3B8]"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Tabs - mobile */}
        <div className="lg:hidden flex overflow-x-auto gap-1 bg-white rounded-xl border border-[#E2E8F0] p-1">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#1B2A6B] text-white"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50"
                }`}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

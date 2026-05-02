"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
  Package,
  FolderTree,
  Warehouse,
  Users,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavSection {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

const navSections: NavSection[] = [
  {
    label: "TIENDA",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
      { href: "/admin/inventario", label: "Inventario", icon: Warehouse },
    ],
  },
  {
    label: "FORMULARIOS",
    items: [
      { href: "/admin/historial", label: "Historial", icon: ClipboardList },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { href: "/admin/contactos", label: "Contactos", icon: Users },
      { href: "/admin/envios", label: "Envios", icon: Truck },
      { href: "/admin/configuracion", label: "Configuracion", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-5 py-6">
        <Link href="/admin">
          <h1
            className="text-xl font-bold"
            style={{
              background: "linear-gradient(135deg, #1B2A6B, #00B4D8, #E91E8C)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PrintUp Admin
          </h1>
        </Link>
      </div>

      <Separator />

      {/* Dashboard link */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive("/admin") ? "#1B2A6B" : "transparent",
                color: isActive("/admin") ? "#FFFFFF" : "#64748B",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/admin")) {
                  e.currentTarget.style.backgroundColor = "#F1F5F9";
                  e.currentTarget.style.color = "#1E293B";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/admin")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }
              }}
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
          </li>
        </ul>

        {/* Sections */}
        {navSections.map((section) => (
          <div key={section.label} className="mt-5">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-wider" style={{ color: "#94A3B8" }}>
              {section.label}
            </p>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: active ? "#1B2A6B" : "transparent",
                        color: active ? "#FFFFFF" : "#64748B",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = "#F1F5F9";
                          e.currentTarget.style.color = "#1E293B";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#64748B";
                        }
                      }}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator />

      {/* Logout */}
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Cerrar sesion
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="fixed top-0 left-0 z-50 flex h-14 w-full items-center border-b bg-white px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <h1
          className="ml-3 text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, #1B2A6B, #00B4D8, #E91E8C)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PrintUp Admin
        </h1>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-white transition-transform md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 border-r bg-white md:block">
        {navContent}
      </aside>
    </>
  );
}

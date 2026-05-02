"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Upload } from "lucide-react";
import { CartIcon } from "@/components/cart/cart-icon";
import { CartDrawer } from "@/components/cart/cart-drawer";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
  { href: "/contacto", label: "Sube tu Archivo", icon: Upload },
];

const categorias = [
  { href: "/productos/articulos-publicitarios", label: "Articulos Publicitarios" },
  { href: "/productos/grafica-publicitaria", label: "Grafica Publicitaria" },
  { href: "/productos/transferibles", label: "Transferibles" },
  { href: "/productos/pendones-y-banderas", label: "Pendones y Banderas" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <div className="w-full bg-[#1B2A6B] text-white text-xs py-2 px-4 text-center">
        <span className="hidden sm:inline">
          Cotizaciones/Consultas al WSP{" "}
          <a href="https://wa.me/56966126645" className="underline hover:text-[#00B4D8]">
            +56 9 66126645
          </a>{" "}
          | contacto@printup.cl
        </span>
        <span className="sm:hidden">
          WSP{" "}
          <a href="https://wa.me/56966126645" className="underline">
            +56 9 66126645
          </a>{" "}
          | contacto@printup.cl
        </span>
      </div>

      {/* Main navbar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-2xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #1B2A6B, #00B4D8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              PrintUp
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.label === "Sube tu Archivo") {
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-[#00B4D8] hover:bg-[#F0F7FF]"
                  >
                    <Upload className="size-4" />
                    {link.label}
                  </Link>
                );
              }
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-[#1B2A6B] bg-[#F0F7FF]"
                      : "text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Categories dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50 transition-colors">
                Categorias
                <ChevronDown className="size-3.5" />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-[#E2E8F0] py-2 z-50">
                  {categorias.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="block px-4 py-2.5 text-sm text-[#1E293B] hover:bg-[#F0F7FF] hover:text-[#1B2A6B] transition-colors"
                      onClick={() => setCatOpen(false)}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <CartIcon onClick={() => setCartOpen(true)} />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] bg-white">
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F0F7FF] transition-colors flex items-center gap-2"
                >
                  {link.icon && <link.icon className="size-4 text-[#00B4D8]" />}
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-[#E2E8F0] my-2" />
              <p className="px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Categorias
              </p>
              {categorias.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm text-[#1E293B] hover:bg-[#F0F7FF] transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Info bar */}
      <div className="w-full bg-[#F0F7FF] border-b border-[#E2E8F0] py-2 px-4 overflow-x-auto">
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-[#1B2A6B] whitespace-nowrap">
          <span>Despachos Miercoles y Viernes</span>
          <span className="w-1 h-1 rounded-full bg-[#00B4D8]" />
          <span>Envio gratis sobre $50.000</span>
          <span className="w-1 h-1 rounded-full bg-[#00B4D8]" />
          <span>Retiro en tienda disponible</span>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

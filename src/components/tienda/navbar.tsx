"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Upload, Heart, User, LogOut } from "lucide-react";
import { CartIcon } from "@/components/cart/cart-icon";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchBar } from "./search-bar";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/components/auth/auth-provider";
import { signOut } from "@/lib/auth-client";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/portafolio", label: "Portafolio" },
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { getItemCount } = useWishlist();
  const wishlistCount = getItemCount();
  const { user, cliente, loading: authLoading } = useAuth();

  // Close user dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      router.refresh();
    } catch {
      // silent
    }
  };

  const firstName = cliente?.nombre?.split(" ")[0] || "";

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

          {/* Right side: search + wishlist + cart + mobile menu */}
          <div className="flex items-center gap-2">
            {/* Desktop search */}
            <SearchBar />

            {/* Wishlist icon */}
            <Link
              href="/favoritos"
              className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
              aria-label={`Favoritos (${wishlistCount} items)`}
            >
              <Heart className="size-5 text-[#1E293B]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-[#E91E8C] rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User account (desktop) */}
            {!authLoading && (
              <div className="hidden md:block">
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-1.5 p-2 rounded-lg transition-colors hover:bg-gray-100 text-sm font-medium text-[#1E293B]"
                    >
                      <User className="size-5" />
                      {firstName && (
                        <span className="max-w-[80px] truncate">{firstName}</span>
                      )}
                      <ChevronDown className="size-3.5" />
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E2E8F0] py-2 z-50">
                        <Link
                          href="/mi-cuenta"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#1E293B] hover:bg-[#F0F7FF] hover:text-[#1B2A6B] transition-colors"
                        >
                          Mi Cuenta
                        </Link>
                        <Link
                          href="/mi-cuenta/pedidos"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#1E293B] hover:bg-[#F0F7FF] hover:text-[#1B2A6B] transition-colors"
                        >
                          Mis Pedidos
                        </Link>
                        <div className="border-t border-[#E2E8F0] my-1" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="size-4" />
                          Cerrar Sesion
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    aria-label="Ingresar"
                  >
                    <User className="size-5 text-[#1E293B]" />
                  </Link>
                )}
              </div>
            )}

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
              <Link
                href="/favoritos"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F0F7FF] transition-colors flex items-center gap-2"
              >
                <Heart className="size-4 text-[#E91E8C]" />
                Favoritos
                {wishlistCount > 0 && (
                  <span className="ml-auto text-xs font-bold text-white bg-[#E91E8C] rounded-full px-2 py-0.5">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              {/* User account (mobile) */}
              {!authLoading && (
                user ? (
                  <Link
                    href="/mi-cuenta"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F0F7FF] transition-colors flex items-center gap-2"
                  >
                    <User className="size-4 text-[#1B2A6B]" />
                    Mi Cuenta
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F0F7FF] transition-colors flex items-center gap-2"
                  >
                    <User className="size-4 text-[#1B2A6B]" />
                    Ingresar
                  </Link>
                )
              )}
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

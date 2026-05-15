"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Upload, Heart, User, LogOut, Phone, Mail, MapPin } from "lucide-react";
import { CartIcon } from "@/components/cart/cart-icon";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchBar } from "./search-bar";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/components/auth/auth-provider";
import { signOut } from "@/lib/auth-client";
import { ScheduleBadge } from "./schedule-badge";
import { AccentLine } from "./decorative";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/productos", label: "Productos" },
  { href: "/portafolio", label: "Portafolio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
  { href: "/contacto", label: "Sube tu Archivo", icon: Upload },
];

const categorias = [
  { href: "/productos/articulos-publicitarios", label: "Articulos Publicitarios", desc: "Tazones, llaveros y mas" },
  { href: "/productos/grafica-publicitaria", label: "Grafica Publicitaria", desc: "Pendones, lienzos y vinilo" },
  { href: "/productos/transferibles", label: "Transferibles", desc: "DTF, DTG y sublimacion" },
  { href: "/productos/pendones-y-banderas", label: "Pendones y Banderas", desc: "Roller, banderas y mas" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { getItemCount } = useWishlist();
  const wishlistCount = getItemCount();
  const { user, cliente, loading: authLoading } = useAuth();

  // Sticky header shrink on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      {/* Top bar premium */}
      <div className={`w-full bg-[#1B2A6B] text-white text-xs py-2 px-4 top-bar ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Schedule badge */}
          <ScheduleBadge />

          {/* Center: Contact info (desktop) */}
          <div className="hidden md:flex items-center gap-5">
            <a href="https://wa.me/56966126645" className="flex items-center gap-1.5 hover:text-[#25D366] transition-colors">
              <Phone className="w-3 h-3" />
              +56 9 66126645
            </a>
            <span className="w-px h-3 bg-white/20" />
            <a href="mailto:contacto@printup.cl" className="flex items-center gap-1.5 hover:text-[#00B4D8] transition-colors">
              <Mail className="w-3 h-3" />
              contacto@printup.cl
            </a>
          </div>

          {/* Right: Location (desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 text-white/60">
            <MapPin className="w-3 h-3" />
            <span>Donihue, O&apos;Higgins</span>
          </div>

          {/* Mobile: compact */}
          <div className="md:hidden flex items-center gap-3">
            <a href="https://wa.me/56966126645" className="hover:text-[#25D366] transition-colors">
              WSP +56 9 66126645
            </a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header className={`sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] header-shrink ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between header-inner">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="https://printup.cl/cdn/shop/files/LOGO-2.gif?v=1768853492"
              alt="PrintUp"
              className="header-logo w-auto"
            />
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

            {/* Categories mega dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-gray-50 transition-colors">
                Categorias
                <ChevronDown className={`size-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-[#E2E8F0] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {categorias.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="flex flex-col px-4 py-3 hover:bg-[#F0F7FF] transition-colors"
                      onClick={() => setCatOpen(false)}
                    >
                      <span className="text-sm font-medium text-[#1E293B]">{cat.label}</span>
                      <span className="text-xs text-[#64748B] mt-0.5">{cat.desc}</span>
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
              {/* Sucursales link */}
              <Link
                href="/sucursales"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#F0F7FF] transition-colors flex items-center gap-2"
              >
                <MapPin className="size-4 text-[#14b8a6]" />
                Nuestro Taller
              </Link>
              {/* Social links mobile */}
              <div className="flex items-center gap-3 px-3 pt-2">
                <a href="https://www.facebook.com/printup.cl" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#F0F7FF] flex items-center justify-center hover:bg-[#1B2A6B] hover:text-white text-[#1B2A6B] transition-colors" aria-label="Facebook">
                  <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="https://www.instagram.com/printup.cl" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#F0F7FF] flex items-center justify-center hover:bg-[#E91E8C] hover:text-white text-[#E91E8C] transition-colors" aria-label="Instagram">
                  <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="https://www.tiktok.com/@printup.cl" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#F0F7FF] flex items-center justify-center hover:bg-black hover:text-white text-[#1E293B] transition-colors" aria-label="TikTok">
                  <svg className="size-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.13a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-2-.61z" /></svg>
                </a>
                <a href="https://wa.me/56966126645" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#F0F7FF] flex items-center justify-center hover:bg-[#25D366] hover:text-white text-[#25D366] transition-colors" aria-label="WhatsApp">
                  <Phone className="size-3.5" />
                </a>
              </div>
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

        {/* Accent line at bottom */}
        <AccentLine />
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

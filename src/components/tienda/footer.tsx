"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { ScheduleBadge } from "./schedule-badge";
import { Logo } from "./logo";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ingresa un email válido");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter/suscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success("Te has suscrito exitosamente");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al suscribirse");
      }
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#0f1115] text-white">
      {/* Registro CMYK — firma del oficio */}
      <div className="mc-cmyk relative z-10" aria-hidden="true"><i /><i /><i /><i /></div>
      {/* Marca de agua tipográfica de prensa */}
      <span
        aria-hidden="true"
        className="pl-poster pointer-events-none select-none absolute -bottom-10 -right-6 text-[22vw] leading-none text-white/[0.035]"
      >
        PrintUp
      </span>
      {/* Resplandor de tinta cyan en la esquina */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,180,216,.13) 0%, transparent 70%)" }}
      />
      {/* Newsletter bar */}
      <div className="border-b border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="text-center md:text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#38bdf8]">
                Newsletter
              </span>
              <h3 className="text-xl font-extrabold mt-1.5 tracking-tight">
                Suscríbete y recibe ofertas exclusivas
              </h3>
              <p className="text-sm text-white/60 mt-1">
                Promociones, novedades y descuentos directo a tu correo.
              </p>
            </div>
            <form
              onSubmit={handleNewsletter}
              className="flex w-full md:w-auto max-w-md gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo electronico"
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-sm text-[#0f1115] bg-white outline-none placeholder:text-[#8b94a3] focus:ring-2 focus:ring-[#00b4d8]/50"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-5 py-2.5 rounded-xl bg-[#00b4d8] text-white font-semibold text-sm hover:bg-[#009ec0] disabled:opacity-60 transition-colors flex items-center gap-2 shrink-0"
              >
                {subscribing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Suscribir
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1: Brand */}
        <div>
          <span className="inline-block rounded-xl bg-white px-3 py-2 shadow-sm">
            <Logo className="h-9 w-auto" />
          </span>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            Imprenta y publicidad en Doñihue, Región de O&apos;Higgins. Imprimimos en
            nuestro taller y te respondemos rápido.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://www.instagram.com/printup.impresiones/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Instagram @printup.impresiones"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61575800949071"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Facebook PrintUp"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://wa.me/56966126645"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366] transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.666-5.895-1.803l-.422-.262-2.753.871.912-2.686-.29-.44A9.712 9.712 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
            </a>
          </div>
        </div>

        {/* Col 2: Links */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Links Rapidos</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href="/productos" className="text-sm text-white/70 hover:text-white transition-colors">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/como-comprar" className="text-sm text-white/70 hover:text-white transition-colors">
                Cómo comprar
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="text-sm text-white/70 hover:text-white transition-colors">
                Contacto
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="text-sm text-white/70 hover:text-white transition-colors">
                Sube tu Archivo
              </Link>
            </li>
            <li>
              <Link href="/carrito" className="text-sm text-white/70 hover:text-white transition-colors">
                Mi Carrito
              </Link>
            </li>
            <li>
              <Link href="/portafolio" className="text-sm text-white/70 hover:text-white transition-colors">
                Portafolio
              </Link>
            </li>
          </ul>
          {/* Politicas */}
          <div className="border-t border-white/10 mt-4 pt-4">
            <ul className="space-y-2.5">
              <li>
                <Link href="/politicas/envio" className="text-sm text-white/70 hover:text-white transition-colors">
                  Politica de Envio
                </Link>
              </li>
              <li>
                <Link href="/politicas/devoluciones" className="text-sm text-white/70 hover:text-white transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/politicas/privacidad" className="text-sm text-white/70 hover:text-white transition-colors">
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Col 3: Horarios & ubicación (datos reales) */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Horarios &amp; ubicación</h3>
          <div className="mb-3">
            <ScheduleBadge showDetail={false} />
          </div>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 shrink-0 text-[#38bdf8]" />
              <span>
                <span className="text-white font-medium">Tienda</span> — Errázuriz 09, Carretera H-30
                <br />
                <span className="text-white/55 text-[13px]">L–J 9–14 · 15:30–18 · V 9–12 · 13:30–18 · S 9–14</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 shrink-0 text-[#38bdf8]" />
              <span>
                <span className="text-white font-medium">Taller</span> — Francisco Lira 082, Doñihue
                <br />
                <span className="text-white/55 text-[13px]">Retiro L–V 15:30–18</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="size-4 mt-0.5 shrink-0 text-[#38bdf8]" />
              <span>
                <span className="text-white font-medium">Online</span> — L–V 10–18 · despachos Mié y Vie · envío gratis sobre $50.000
              </span>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Contacto</h3>
          <ul className="space-y-2.5">
            <li>
              <a
                href="mailto:contacto@printup.cl"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Mail className="size-4 shrink-0" />
                contacto@printup.cl
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/56966126645"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone className="size-4 shrink-0" />
                +56 9 66126645
              </a>
            </li>
            <li className="flex items-start gap-2 text-sm text-white/70">
              <MapPin className="size-4 mt-0.5 shrink-0" />
              Region de O&apos;Higgins, Chile
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:pr-24 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Sello: proveedor del Estado — Mercado Público / ChileCompra */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-lg bg-white px-3 py-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/chilecompra-mercadopublico.png"
                alt="ChileCompra · Mercado Público"
                width={595}
                height={131}
                className="h-7 w-auto"
              />
            </span>
            <span className="text-xs leading-tight text-white/60">
              Proveedor del Estado
              <br />
              en Mercado Público
            </span>
          </div>
          <p className="text-center text-xs text-white/50 sm:text-right">
            &copy; 2026 PrintUp · Servicios Gráficos Spa · RUT 78.114.353-7
          </p>
        </div>
      </div>
    </footer>
  );
}

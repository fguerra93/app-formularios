"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/tienda/hero";
import { CategoryCard } from "@/components/tienda/category-card";
import { ProductCard } from "@/components/tienda/product-card";
import { StatsCounter } from "@/components/tienda/stats-counter";
import { Testimonials } from "@/components/tienda/testimonials";
import { FaqAccordion } from "@/components/tienda/faq-accordion";
import { CotizadorInline } from "@/components/tienda/cotizador";
import { FloatingCircles, PulsingDots, AccentLine, GlassmorphCard, RotatingRing } from "@/components/tienda/decorative";
import { Skeleton } from "@/components/ui/skeleton";
import type { Categoria, Producto, Trabajo, ClienteDestacado } from "@/lib/types";
import { Package, Truck, MousePointerClick, ArrowRight, Image as ImageIcon, Upload, Palette, CheckCircle, HelpCircle } from "lucide-react";
import { StaggerContainer, StaggerItem, ScrollReveal } from "@/components/tienda/motion";

export default function HomePage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [clientes, setClientes] = useState<ClienteDestacado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/categorias").then((r) => r.json()),
      fetch("/api/productos?destacado=true&limit=8").then((r) => r.json()),
      fetch("/api/portafolio?destacado=true&limit=4").then((r) => r.json()),
      fetch("/api/portafolio/clientes").then((r) => r.json()),
    ])
      .then(([cats, prods, trab, cli]) => {
        setCategorias(Array.isArray(cats) ? cats : []);
        setProductos(Array.isArray(prods?.productos) ? prods.productos : []);
        setTrabajos(Array.isArray(trab) ? trab : []);
        setClientes(Array.isArray(cli) ? cli : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Nuestras Categorias
          </h2>
          <p className="text-[#64748B]">
            Explora nuestros productos por categoria
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#1B2A6B] to-[#00B4D8] mx-auto mt-4 rounded-full" />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categorias.map((cat) => (
              <StaggerItem key={cat.id}>
                <CategoryCard categoria={cat} productCount={(cat as Categoria & { product_count?: number }).product_count} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Productos Destacados
          </h2>
          <p className="text-[#64748B]">
            Los mas solicitados por nuestros clientes
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#00B4D8] to-[#FF9710] mx-auto mt-4 rounded-full" />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {productos.map((prod) => (
              <StaggerItem key={prod.id}>
                <ProductCard producto={prod} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
        <div className="text-center mt-8">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#152259] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
          >
            Ver todo el catalogo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Products by Category Tabs - ChileImprime style */}
      {!loading && categorias.length > 0 && (
        <ProductosPorCategoria categorias={categorias} />
      )}

      {/* Cotizador Inline */}
      <CotizadorInline />

      {/* How it works - 4 steps */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
        <PulsingDots color="rgba(0, 180, 216, 0.3)" />

        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Como Funciona
          </h2>
          <p className="text-[#64748B]">4 simples pasos para tu producto personalizado</p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#1B2A6B] to-[#00B4D8] mx-auto mt-4 rounded-full" />
        </div>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { icon: MousePointerClick, step: "1", title: "Elige tu producto", desc: "Explora nuestro catalogo y selecciona lo que necesitas", color: "#00B4D8" },
            { icon: Upload, step: "2", title: "Envia tu diseno", desc: "Sube tu archivo o cuentanos tu idea y te ayudamos", color: "#8b5cf6" },
            { icon: Palette, step: "3", title: "Produccion", desc: "Imprimimos con la mejor tecnologia DTF, DTG y mas", color: "#FF9710" },
            { icon: Truck, step: "4", title: "Recibe o retira", desc: "Despacho a domicilio o retira en nuestra tienda", color: "#10b981" },
          ].map((item) => (
            <StaggerItem key={item.step}>
              <div className="relative text-center p-6 md:p-8 rounded-2xl bg-white border border-[#E2E8F0] hover-glow transition-all group">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)` }}
                  >
                    {item.step}
                  </span>
                </div>

                {/* Icon with glow */}
                <div
                  className="w-16 h-16 mx-auto mb-4 mt-2 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: `${item.color}15`,
                    boxShadow: `0 0 30px ${item.color}20`,
                  }}
                >
                  <item.icon className="size-7" style={{ color: item.color }} />
                </div>

                <h3 className="font-bold text-[#1E293B] mb-2">{item.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Connector line (desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-px bg-gradient-to-r from-[#00B4D8]/20 via-[#FF9710]/20 to-[#10b981]/20 -translate-y-4 z-0" />
      </section>

      {/* Stats */}
      <StatsCounter />

      {/* Trabajos Recientes */}
      {trabajos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
              Trabajos Recientes
            </h2>
            <p className="text-[#64748B]">Lo ultimo que hemos creado</p>
            <div className="w-16 h-1 bg-gradient-to-r from-[#a855f7] to-[#ec4899] mx-auto mt-4 rounded-full" />
          </div>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trabajos.map((trabajo) => (
              <StaggerItem key={trabajo.id}>
                <Link
                  href="/portafolio"
                  className="group block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover-glow transition-all duration-200"
                >
                  <div className="relative aspect-[4/3] bg-[#F0F7FF] overflow-hidden">
                    {trabajo.imagenes?.[0]?.url ? (
                      <img
                        src={trabajo.imagenes[0].url}
                        alt={trabajo.imagenes[0].alt || trabajo.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="size-16 text-[#00B4D8]/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {trabajo.categoria && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00B4D8]/10 text-[#00B4D8] text-xs font-medium mb-2">
                        {trabajo.categoria}
                      </span>
                    )}
                    <h3 className="font-semibold text-[#1E293B] text-sm leading-snug line-clamp-2">
                      {trabajo.titulo}
                    </h3>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <div className="text-center mt-8">
            <Link
              href="/portafolio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#152259] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md"
            >
              Ver todos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <Testimonials />

      {/* Confian en nosotros */}
      {clientes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
              Confian en Nosotros
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-[#1B2A6B] to-[#00B4D8] mx-auto mt-4 rounded-full" />
          </div>
          <div className="overflow-hidden relative">
            <div className="flex animate-marquee-home whitespace-nowrap">
              {[...clientes, ...clientes].map((cliente, idx) => (
                <div
                  key={`${cliente.id}-${idx}`}
                  className="mx-8 flex items-center justify-center shrink-0"
                >
                  {cliente.url_web ? (
                    <a href={cliente.url_web} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={cliente.logo_url}
                        alt={cliente.nombre}
                        className="h-12 w-auto max-w-[140px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                      />
                    </a>
                  ) : (
                    <img
                      src={cliente.logo_url}
                      alt={cliente.nombre}
                      className="h-12 w-auto max-w-[140px] object-contain grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner - Premium glassmorphic */}
      <ScrollReveal>
        <section className="py-16 md:py-24 px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B2A6B 0%, #00355a 50%, #00B4D8 100%)" }}>
          <FloatingCircles theme="hero" />
          <PulsingDots color="rgba(255,255,255,0.3)" />
          <RotatingRing size={160} color="rgba(255,255,255,0.08)" className="hidden md:block -right-10 top-10" />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left text-white">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ letterSpacing: "-0.02em" }}>
                Personaliza Tus Poleras
              </h2>
              <p className="text-white/70 mb-6 text-base md:text-lg">
                Impresion DTG y DTF de alta calidad. Envia tu diseno y nosotros lo hacemos realidad.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                {["Sin minimo de unidades", "Colores vibrantes", "Envio gratis +$50k"].map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-white/80 text-sm">
                    <CheckCircle className="w-4 h-4 text-[#10b981]" />
                    {b}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
                <Link
                  href="/contacto"
                  className="px-8 py-3.5 rounded-xl bg-[#FF9710] text-white font-bold text-sm hover:bg-[#e8880e] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                  Enviar mi diseno
                </Link>
                <a
                  href="https://wa.me/56966126645"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 rounded-xl border-2 border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Cotizar por WhatsApp
                </a>
              </div>
            </div>
            <div className="flex-shrink-0 relative">
              <img
                src="https://printup.cl/cdn/shop/files/POLERAS.jpg"
                alt="Poleras personalizadas PrintUp"
                className="w-56 h-56 md:w-64 md:h-64 object-cover rounded-2xl shadow-2xl border-4 border-white/20"
              />
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#00B4D8]/20 to-[#FF9710]/20 blur-xl -z-10" />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* FAQ Preview */}
      <section className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[#00B4D8] text-sm font-medium mb-3">
            <HelpCircle className="w-4 h-4" />
            Preguntas Frecuentes
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Resolvemos tus dudas
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#64748b] to-[#00B4D8] mx-auto mt-4 rounded-full" />
        </div>
        <FaqAccordion limit={4} />
      </section>

      {/* Siguenos en Redes Sociales */}
      <section className="relative py-16 px-4 overflow-hidden" style={{ background: "#1B2A6B" }}>
        <FloatingCircles theme="stats" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            Siguenos en Nuestras Redes Sociales
          </h2>
          <p className="text-white/60 text-sm mb-10">
            Mira nuestros trabajos, novedades y promociones
          </p>
          <div className="flex items-center justify-center gap-6">
            {[
              { href: "https://www.facebook.com/printup.cl", label: "Facebook", path: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" },
              { href: "https://www.instagram.com/printup.cl", label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
              { href: "https://www.tiktok.com/@printup.cl", label: "TikTok", path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.label} de PrintUp`}
                className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl glass hover:bg-white/20 transition-all duration-200 hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-8 md:h-8 text-white" aria-hidden="true">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ===== Products by Category Tabs =====
function ProductosPorCategoria({ categorias }: { categorias: Categoria[] }) {
  const [activeCat, setActiveCat] = useState(categorias[0]?.slug || "");
  const [catProducts, setCatProducts] = useState<Producto[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (!activeCat) return;
    setCatLoading(true);
    fetch(`/api/productos?categoria=${activeCat}&limit=4`)
      .then((r) => r.json())
      .then((data) => {
        setCatProducts(Array.isArray(data?.productos) ? data.productos : []);
      })
      .catch(() => setCatProducts([]))
      .finally(() => setCatLoading(false));
  }, [activeCat]);

  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
          Explora por Categoria
        </h2>
        <p className="text-[#64748B]">Encuentra exactamente lo que necesitas</p>
        <div className="w-16 h-1 bg-gradient-to-r from-[#1B2A6B] to-[#00B4D8] mx-auto mt-4 rounded-full" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.slug)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCat === cat.slug
                ? "bg-[#1B2A6B] text-white shadow-md"
                : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#00B4D8] hover:text-[#1E293B]"
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {catLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : catProducts.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {catProducts.map((prod) => (
            <StaggerItem key={prod.id}>
              <ProductCard producto={prod} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-12 text-sm text-[#64748B]">
          No hay productos en esta categoria todavia.
        </div>
      )}

      {/* Ver todos link */}
      {catProducts.length > 0 && (
        <div className="text-center mt-6">
          <Link
            href={`/productos/${activeCat}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00B4D8] hover:text-[#1B2A6B] transition-colors"
          >
            Ver todos en esta categoria
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

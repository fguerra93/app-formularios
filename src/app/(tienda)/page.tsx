"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/tienda/hero";
import { CategoryCard } from "@/components/tienda/category-card";
import { ProductCard } from "@/components/tienda/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Categoria, Producto, Trabajo, ClienteDestacado } from "@/lib/types";
import { Package, Truck, MousePointerClick, ArrowRight, Image as ImageIcon } from "lucide-react";
import { StaggerContainer, StaggerItem, FadeIn, ScrollReveal } from "@/components/tienda/motion";

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
        <h2 className="text-2xl font-extrabold text-[#1E293B] text-center mb-2" style={{ letterSpacing: "-0.02em" }}>
          Nuestras Categorias
        </h2>
        <p className="text-[#64748B] text-center mb-8">
          Explora nuestros productos por categoria
        </p>
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
                <CategoryCard categoria={cat} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-extrabold text-[#1E293B] text-center mb-2" style={{ letterSpacing: "-0.02em" }}>
          Productos Destacados
        </h2>
        <p className="text-[#64748B] text-center mb-8">
          Los mas solicitados por nuestros clientes
        </p>
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
      </section>

      {/* Trabajos Recientes */}
      {trabajos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-extrabold text-[#1E293B] text-center mb-2" style={{ letterSpacing: "-0.02em" }}>
            Trabajos Recientes
          </h2>
          <p className="text-[#64748B] text-center mb-8">
            Lo ultimo que hemos creado
          </p>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trabajos.map((trabajo) => (
              <StaggerItem key={trabajo.id}>
                <Link
                  href="/portafolio"
                  className="group block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-200"
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#152259] transition-colors"
            >
              Ver todos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Confian en nosotros */}
      {clientes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-extrabold text-[#1E293B] text-center mb-8" style={{ letterSpacing: "-0.02em" }}>
            Confian en Nosotros
          </h2>
          <div className="overflow-hidden relative">
            <div className="flex animate-marquee-home whitespace-nowrap">
              {[...clientes, ...clientes].map((cliente, idx) => (
                <div
                  key={`${cliente.id}-${idx}`}
                  className="mx-8 flex items-center justify-center shrink-0"
                >
                  {cliente.url_web ? (
                    <a
                      href={cliente.url_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
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

      {/* CTA Banner */}
      <ScrollReveal>
        <section
          className="py-16 px-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1B2A6B 0%, #00B4D8 100%)",
          }}
        >
          {/* Decorative shapes */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left text-white">
              <h2 className="text-3xl font-extrabold mb-4" style={{ letterSpacing: "-0.02em" }}>
                Personaliza Tus Poleras
              </h2>
              <p className="text-white/80 mb-6">
                Impresion DTG y DTF de alta calidad. Envia tu diseno y nosotros lo hacemos realidad.
              </p>
              <Link
                href="/contacto"
                className="inline-block px-8 py-3.5 rounded-lg bg-[#FF9710] text-white font-bold text-sm hover:bg-[#e8880e] transition-colors shadow-lg"
              >
                Enviar mi diseno
              </Link>
            </div>
            <div className="flex-shrink-0">
              <img
                src="https://printup.cl/cdn/shop/files/POLERAS.jpg"
                alt="Poleras personalizadas PrintUp"
                className="w-64 h-64 object-cover rounded-2xl shadow-2xl border-4 border-white/20"
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-[#1E293B] text-center mb-10" style={{ letterSpacing: "-0.02em" }}>
          Como Funciona
        </h2>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: MousePointerClick,
              step: "1",
              title: "Elige tu producto",
              desc: "Explora nuestro catalogo y selecciona lo que necesitas",
            },
            {
              icon: Package,
              step: "2",
              title: "Personaliza",
              desc: "Sube tu diseno o cuentanos tu idea y nosotros la creamos",
            },
            {
              icon: Truck,
              step: "3",
              title: "Recibe en tu puerta",
              desc: "Despacho a domicilio o retira en nuestra tienda en Donihue",
            },
          ].map((item) => (
            <StaggerItem
              key={item.step}
              className="text-center p-8 rounded-xl bg-white border border-[#E2E8F0] hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] flex items-center justify-center">
                <item.icon className="size-6 text-white" />
              </div>
              <div className="text-xs font-bold text-[#00B4D8] mb-2">
                PASO {item.step}
              </div>
              <h3 className="font-bold text-[#1E293B] mb-2">{item.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Siguenos en Redes Sociales */}
      <section
        className="py-16 px-4"
        style={{ background: "#1B2A6B" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            Siguenos en Nuestras Redes Sociales
          </h2>
          <p className="text-white/60 text-sm mb-10">
            Mira nuestros trabajos, novedades y promociones
          </p>
          <div className="flex items-center justify-center gap-8">

            {/* Facebook */}
            <a
              href="https://www.facebook.com/printup.cl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook de PrintUp"
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-white"
                aria-hidden="true"
              >
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/printup.cl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de PrintUp"
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-white"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@printup.cl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok de PrintUp"
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-white"
                aria-hidden="true"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
              </svg>
            </a>

          </div>
        </div>
      </section>
    </>
  );
}

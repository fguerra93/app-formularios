"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/tienda/hero";
import { CategoryCard } from "@/components/tienda/category-card";
import { ProductCard } from "@/components/tienda/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Categoria, Producto, Trabajo, ClienteDestacado } from "@/lib/types";
import { Package, Truck, MousePointerClick, ArrowRight, Image as ImageIcon } from "lucide-react";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/tienda/motion";

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
      <section
        className="py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #1B2A6B, #00B4D8)",
        }}
      >
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4" style={{ letterSpacing: "-0.02em" }}>
            Personaliza Tus Poleras
          </h2>
          <p className="text-white/80 mb-6">
            Impresion DTG y DTF de alta calidad. Envia tu diseno y nosotros lo hacemos realidad.
          </p>
          <Link
            href="/contacto"
            className="inline-block px-8 py-3.5 rounded-lg bg-white text-[#1B2A6B] font-bold text-sm hover:bg-white/90 transition-colors"
          >
            Enviar mi diseno
          </Link>
        </div>
      </section>

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
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero } from "@/components/tienda/hero";
import { CategoryCard } from "@/components/tienda/category-card";
import { ProductCard } from "@/components/tienda/product-card";
import { SectionHeader } from "@/components/tienda/section-header";
import { StatsCounter } from "@/components/tienda/stats-counter";
import { Testimonials } from "@/components/tienda/testimonials";
import { FaqAccordion } from "@/components/tienda/faq-accordion";
import { CotizadorInline } from "@/components/tienda/cotizador";
import { Skeleton } from "@/components/ui/skeleton";
import type { Categoria, Producto, Trabajo, ClienteDestacado } from "@/lib/types";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/tienda/motion";

const verCatalogoLink = (
  <Link href="/productos" className="mc-link text-sm">
    Ver todo el catálogo <ArrowRight className="size-4" />
  </Link>
);

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
      <Hero />

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <SectionHeader
          eyebrow="Catálogo"
          title="Explora por categoría"
          sub="Encuentra exactamente lo que tu marca necesita."
          action={verCatalogoLink}
        />
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />)}
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

      {/* Productos destacados — banda surface para ritmo */}
      <section style={{ background: "var(--mc-surface)" }} className="border-y border-[#e8eaee]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <SectionHeader
            eyebrow="Lo más pedido"
            title="Productos destacados"
            action={verCatalogoLink}
          />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productos.map((prod) => (
                <StaggerItem key={prod.id}><ProductCard producto={prod} /></StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Productos por categoría (tabs) */}
      {!loading && categorias.length > 0 && <ProductosPorCategoria categorias={categorias} />}

      <CotizadorInline />

      {/* Cómo funciona — numerado, un solo acento */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <SectionHeader eyebrow="Proceso" title="Cómo funciona" sub="4 pasos simples, de tu idea al producto." />
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#e8eaee] rounded-2xl overflow-hidden border border-[#e8eaee]">
          {[
            { n: "01", title: "Elige tu producto", desc: "Explora el catálogo y selecciona lo que necesitas." },
            { n: "02", title: "Envía tu diseño", desc: "Sube tu archivo o cuéntanos tu idea y te ayudamos." },
            { n: "03", title: "Producción", desc: "Imprimimos con tecnología DTF, DTG, sublimación y más." },
            { n: "04", title: "Recibe o retira", desc: "Despacho a domicilio o retiro en nuestro taller." },
          ].map((item) => (
            <StaggerItem key={item.n}>
              <div className="h-full bg-white p-6 md:p-7">
                <span className="mc-tech text-2xl font-bold tracking-tight" style={{ color: "var(--mc-ink-3)" }}>{item.n}</span>
                <hr className="mc-rule my-4" />
                <h3 className="font-semibold text-[15px] mb-1.5" style={{ color: "var(--mc-ink)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--mc-ink-2)" }}>{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <StatsCounter />

      {/* Trabajos recientes */}
      {trabajos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <SectionHeader
            eyebrow="Portafolio"
            title="Trabajos recientes"
            action={<Link href="/portafolio" className="mc-link text-sm">Ver todos <ArrowRight className="size-4" /></Link>}
          />
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trabajos.map((trabajo) => (
              <StaggerItem key={trabajo.id}>
                <Link href="/portafolio" className="mc-card mc-card-hover group block overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--mc-surface)" }}>
                    {trabajo.imagenes?.[0]?.url ? (
                      <img src={trabajo.imagenes[0].url} alt={trabajo.imagenes[0].alt || trabajo.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="size-12" style={{ color: "var(--mc-ink-3)" }} /></div>
                    )}
                  </div>
                  <div className="p-4">
                    {trabajo.categoria && <span className="mc-eyebrow">{trabajo.categoria}</span>}
                    <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 mt-1.5" style={{ color: "var(--mc-ink)" }}>{trabajo.titulo}</h3>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      <Testimonials />

      {/* Confían en nosotros */}
      {clientes.length > 0 && (
        <section style={{ background: "var(--mc-surface)" }} className="border-y border-[#e8eaee]">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <p className="mc-eyebrow text-center mb-8">Confían en nosotros</p>
            <div className="overflow-hidden relative">
              <div className="flex animate-marquee-home whitespace-nowrap">
                {[...clientes, ...clientes].map((cliente, idx) => (
                  <div key={`${cliente.id}-${idx}`} className="mx-8 flex items-center justify-center shrink-0">
                    {cliente.url_web ? (
                      <a href={cliente.url_web} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={cliente.logo_url} alt={cliente.nombre} className="h-10 w-auto max-w-[140px] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                      </a>
                    ) : (
                      <img src={cliente.logo_url} alt={cliente.nombre} className="h-10 w-auto max-w-[140px] object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pliego fotográfico — poleras a pantalla completa */}
      <section className="relative overflow-hidden" style={{ background: "#0a0b0d" }}>
        <img
          src="https://printup.cl/cdn/shop/files/POLERAS.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(98deg, rgba(10,11,13,.95) 0%, rgba(10,11,13,.78) 48%, rgba(10,11,13,.3) 100%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-28">
          <p className="mc-tech text-[12px] uppercase tracking-[0.16em] mb-4" style={{ color: "var(--mc-accent)" }}>
            Poleras personalizadas · DTG y DTF
          </p>
          <h2 className="pl-poster text-white text-5xl md:text-7xl max-w-3xl">
            Tu diseño,
            <br />
            en tela de verdad.
          </h2>
          <p className="mt-5 max-w-md text-white/65 leading-relaxed">
            Alta durabilidad, colores vibrantes y sin mínimo de unidades.
            Envío gratis sobre $50.000.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0f1115] font-bold text-[15px] px-7 py-3.5 hover:bg-[#e8eaee] transition-colors"
            >
              Enviar mi diseño
            </Link>
            <a
              href="https://wa.me/56966126645"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold text-[15px] px-7 py-3.5 hover:border-white hover:bg-white/5 transition-colors"
            >
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        <SectionHeader eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <FaqAccordion limit={4} />
      </section>
    </>
  );
}

// ===== Productos por categoría (tabs) =====
function ProductosPorCategoria({ categorias }: { categorias: Categoria[] }) {
  const [activeCat, setActiveCat] = useState(categorias[0]?.slug || "");
  const [catProducts, setCatProducts] = useState<Producto[]>([]);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (!activeCat) return;
    setCatLoading(true);
    fetch(`/api/productos?categoria=${activeCat}&limit=4`)
      .then((r) => r.json())
      .then((data) => setCatProducts(Array.isArray(data?.productos) ? data.productos : []))
      .catch(() => setCatProducts([]))
      .finally(() => setCatLoading(false));
  }, [activeCat]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
      <SectionHeader eyebrow="Por categoría" title="Encuentra lo que buscas" />

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {categorias.map((cat) => {
          const active = activeCat === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.slug)}
              className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border"
              style={
                active
                  ? { background: "var(--mc-ink)", color: "#fff", borderColor: "var(--mc-ink)" }
                  : { background: "#fff", color: "var(--mc-ink-2)", borderColor: "var(--mc-line)" }
              }
            >
              {cat.nombre}
            </button>
          );
        })}
      </div>

      {catLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      ) : catProducts.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {catProducts.map((prod) => <StaggerItem key={prod.id}><ProductCard producto={prod} /></StaggerItem>)}
        </StaggerContainer>
      ) : (
        <div className="text-center py-12 text-sm" style={{ color: "var(--mc-ink-2)" }}>No hay productos en esta categoría todavía.</div>
      )}

      {catProducts.length > 0 && (
        <div className="mt-8">
          <Link href={`/productos/${activeCat}`} className="mc-link text-sm">
            Ver todos en esta categoría <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

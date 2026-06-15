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
import { ArrowRight, Image as ImageIcon, Clock, Package, Eye, Truck } from "lucide-react";
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

      {/* Transición amable banner → contenido: guiño CMYK fino + degradado a off-white */}
      <div aria-hidden="true">
        <div
          className="h-[3px] w-full"
          style={{ background: "linear-gradient(90deg,#00B4D8,#1B2A6B,#E91E8C,#FF9710)", opacity: 0.6 }}
        />
        <div
          className="h-16 md:h-24"
          style={{ background: "linear-gradient(180deg,#0a0b0d 0%,#11131a 35%,#f5f6f9 100%)" }}
        />
      </div>

      <div style={{ background: "#f5f6f9" }}>
      {/* Qué resolvemos — el porqué, reforzado */}
      <section className="max-w-7xl mx-auto px-4 pt-16 md:pt-20">
        <SectionHeader
          eyebrow="Por qué PrintUp"
          title="Imprimir, sin dolores de cabeza"
          sub="Lo que más nos agradecen quienes ya imprimen con nosotros."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Clock, pain: "¿Cotizaciones que tardan días?", sol: "Te respondemos en minutos por WhatsApp, no en 48 horas." },
            { icon: Package, pain: "¿Mínimos imposibles?", sol: "Imprimimos desde 1 unidad. Una polera o cien, da igual." },
            { icon: Eye, pain: "¿No sabes preparar el archivo?", sol: "Pruébalo en la ficha y lo revisamos antes de imprimir." },
            { icon: Truck, pain: "¿Lo necesitas ya?", sol: "Sale del taller en 24–48 h. Retiro en Doñihue o despacho." },
          ].map((c) => (
            <div key={c.pain} className="rounded-2xl border bg-white p-5 transition-shadow hover:shadow-[0_10px_30px_-16px_rgba(15,17,21,.25)]" style={{ borderColor: "var(--mc-line)" }}>
              <div className="flex size-10 items-center justify-center rounded-xl mb-3" style={{ background: "var(--mc-accent-soft)" }}>
                <c.icon className="size-5" style={{ color: "var(--mc-accent-ink)" }} />
              </div>
              <p className="text-sm font-bold" style={{ color: "var(--mc-ink)" }}>{c.pain}</p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--mc-ink-2)" }}>{c.sol}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <SectionHeader
          eyebrow="Catálogo"
          title="Explora por categoría"
          sub="Encuentra exactamente lo que tu marca necesita."
          action={verCatalogoLink}
        />
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:auto-rows-[210px]">
            <Skeleton className="col-span-2 row-span-2 rounded-none min-h-[300px]" />
            {[2, 3, 4, 5].map((i) => <Skeleton key={i} className="rounded-none min-h-[210px]" />)}
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:auto-rows-[210px]">
            {(() => {
              // Gráfica Publicitaria es la protagonista: ocupa la celda grande.
              const grafica = categorias.find((c) => c.slug === "grafica-publicitaria");
              const ordenadas = grafica
                ? [grafica, ...categorias.filter((c) => c.id !== grafica.id)]
                : categorias;
              return ordenadas.map((cat, idx) => (
                <StaggerItem key={cat.id} className={idx === 0 ? "col-span-2 lg:row-span-2 h-full" : "h-full"}>
                  <CategoryCard
                    categoria={cat}
                    featured={idx === 0}
                    productCount={(cat as Categoria & { product_count?: number }).product_count}
                  />
                </StaggerItem>
              ));
            })()}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="rounded-2xl min-h-[360px]" />)}
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {productos.slice(0, 4).map((prod, idx) => (
                <StaggerItem key={prod.id} className="relative">
                  <span
                    className="absolute -top-2 -left-2 z-10 flex size-7 items-center justify-center rounded-full text-xs font-bold shadow-md"
                    style={{ background: "var(--mc-ink)", color: "#fff" }}
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <ProductCard producto={prod} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* Productos por categoría (tabs) */}
      {!loading && categorias.length > 0 && <ProductosPorCategoria categorias={categorias} />}

      <CotizadorInline />

      {/* Cómo funciona — línea de tiempo con números de pliego */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <SectionHeader eyebrow="Proceso" title="De tu idea al taller" sub="Cuatro pasos. Sin vueltas." />
        <StaggerContainer className="relative mt-12 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
          {/* Riel conector (desktop) */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px lg:block"
            style={{ background: "var(--mc-line-2)" }}
            aria-hidden="true"
          />
          {[
            { n: "01", title: "Elige tu producto", desc: "Explora el catálogo y configura tu medida con precio en vivo." },
            { n: "02", title: "Envía tu diseño", desc: "Súbelo y velo a escala, o cuéntanos tu idea y te ayudamos." },
            { n: "03", title: "Producción", desc: "Imprimimos acá: DTF, DTG, sublimación y gran formato." },
            { n: "04", title: "Recibe o retira", desc: "Despacho a domicilio o retiro gratis en el taller." },
          ].map((item) => (
            <StaggerItem key={item.n} className="relative lg:pr-8">
              {/* Nodo sobre el riel */}
              <span
                className="absolute left-[3px] top-[46px] hidden size-3 rounded-full ring-4 ring-white lg:block"
                style={{ background: "var(--mc-accent)" }}
                aria-hidden="true"
              />
              <div className="flex items-start gap-4 lg:block">
                <span
                  className="pl-poster shrink-0 text-6xl leading-none md:text-7xl lg:text-[5.5rem]"
                  style={{
                    color: "transparent",
                    WebkitTextStroke: "1.5px var(--mc-ink)",
                  }}
                >
                  {item.n}
                </span>
                <div className="lg:mt-7">
                  <h3 className="font-semibold text-lg mb-1.5" style={{ color: "var(--mc-ink)" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed max-w-[26ch]" style={{ color: "var(--mc-ink-2)" }}>{item.desc}</p>
                </div>
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
          src="https://cdn.shopify.com/s/files/1/0865/0077/0149/files/DTFTEXTIL2.jpg?v=1768931472"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(10,11,13,.93) 0%, rgba(10,11,13,.72) 42%, rgba(10,11,13,.22) 76%, rgba(10,11,13,0) 100%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-28">
          <p className="mc-tech text-[12px] uppercase tracking-[0.16em] mb-4" style={{ color: "var(--mc-accent)" }}>
            Estampado textil · DTF y DTG
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
      </div>
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

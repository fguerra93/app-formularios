"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/components/auth/auth-provider";
import { formatCLP } from "@/lib/format";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { QuantitySelector } from "@/components/tienda/quantity-selector";
import { ProductCard } from "@/components/tienda/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Truck, Info, Star, Send, Bell, MessageCircle, FileDown, Palette, Check, Shield, Clock, Headphones, Zap, Award, ChevronUp, Wrench, Eye, Lightbulb, Target, Layers, Sparkles, Tag, Folder } from "lucide-react";
import { toast } from "sonner";
import { ProductGallery } from "@/components/tienda/image-lightbox";
import { PriceCalculator } from "@/components/tienda/price-calculator";
import { SpecTable } from "@/components/tienda/spec-table";
import type { Producto, PrecioCantidad, PreguntaProducto } from "@/lib/types";

interface Review {
  id: string;
  autor_nombre: string;
  rating: number;
  titulo?: string;
  comentario: string;
  verificada: boolean;
  created_at: string;
}

function StarRatingDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-6" : "size-4";
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-gray-300"
          }`}
        />
      ))}
    </span>
  );
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`size-7 transition-colors ${
              i <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300 hover:text-yellow-300"
            }`}
          />
        </button>
      ))}
    </span>
  );
}

export default function ProductoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const categoriaSlug = params.categoria as string;
  const { addItem } = useCart();
  const { user, cliente } = useAuth();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"descripcion" | "especificaciones" | "envio" | "preguntas">("descripcion");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitulo, setReviewTitulo] = useState("");
  const [reviewComentario, setReviewComentario] = useState("");
  const [reviewNombre, setReviewNombre] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [stockNotifEmail, setStockNotifEmail] = useState("");
  const [stockNotifSending, setStockNotifSending] = useState(false);
  const [stockNotifDone, setStockNotifDone] = useState(false);
  // Q&A state
  const [preguntas, setPreguntas] = useState<PreguntaProducto[]>([]);
  const [preguntasLoading, setPreguntasLoading] = useState(true);
  const [showPreguntaForm, setShowPreguntaForm] = useState(false);
  const [preguntaTexto, setPreguntaTexto] = useState("");
  const [preguntaNombre, setPreguntaNombre] = useState("");
  const [preguntaEmail, setPreguntaEmail] = useState("");
  const [preguntaSending, setPreguntaSending] = useState(false);
  // Sticky mobile bar
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Auto-fill review form when logged in
  useEffect(() => {
    if (cliente) {
      setReviewNombre(cliente.nombre);
      setReviewEmail(cliente.email);
    }
  }, [cliente]);

  // Auto-fill stock notification email & Q&A form
  useEffect(() => {
    if (cliente) {
      setStockNotifEmail(cliente.email);
      setPreguntaNombre(cliente.nombre);
      setPreguntaEmail(cliente.email);
    }
  }, [cliente]);

  // IntersectionObserver for sticky mobile bar
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [producto]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/productos/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setProducto(null);
        } else {
          setProducto(data);
          // Set default variants
          const defaults: Record<string, string> = {};
          data.variantes?.forEach((v: { nombre: string; opciones: { valor: string }[] }) => {
            if (v.opciones.length > 0) {
              defaults[v.nombre] = v.opciones[0].valor;
            }
          });
          setSelectedVariants(defaults);
          // Dynamic page title
          document.title = `${data.nombre} - ${formatCLP(data.precio)} | PrintUp`;
        }
      })
      .finally(() => setLoading(false));

    // Load related products
    fetch(`/api/productos?categoria=${categoriaSlug}&limit=4`)
      .then((r) => r.json())
      .then((data) => {
        const prods = Array.isArray(data?.productos) ? data.productos : [];
        setRelacionados(
          prods.filter((p: Producto) => p.slug !== slug).slice(0, 4)
        );
      });

    // Load reviews
    setReviewsLoading(true);
    fetch(`/api/productos/${slug}/reviews`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));

    // Load Q&A
    setPreguntasLoading(true);
    fetch(`/api/productos/${slug}/preguntas`)
      .then((r) => r.json())
      .then((data) => setPreguntas(Array.isArray(data) ? data : []))
      .catch(() => setPreguntas([]))
      .finally(() => setPreguntasLoading(false));
  }, [slug, categoriaSlug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#1E293B] mb-4">Producto no encontrado</h1>
        <Button nativeButton={false} render={<Link href="/productos" />}>
          Ver todos los productos
        </Button>
      </div>
    );
  }

  const catName = producto.categoria?.nombre || categoriaSlug.replace(/-/g, " ");
  const hasOffer = producto.precio_oferta !== null && producto.precio_oferta < producto.precio;
  const normalPrice = hasOffer ? producto.precio_oferta! : producto.precio;

  // Quantity pricing
  const preciosCantidad: PrecioCantidad[] = Array.isArray(producto.precios_cantidad)
    ? producto.precios_cantidad
    : [];

  const getQuantityPrice = (qty: number): number => {
    if (preciosCantidad.length === 0) return normalPrice;
    const match = preciosCantidad.find(
      (p) => qty >= p.cantidad_min && (p.cantidad_max === null || qty <= p.cantidad_max)
    );
    return match ? match.precio : normalPrice;
  };

  const basePrice = getQuantityPrice(cantidad);

  // Calculate extra price from selected variants
  let precioExtra = 0;
  producto.variantes?.forEach((v) => {
    const selected = selectedVariants[v.nombre];
    if (selected) {
      const opt = v.opciones.find((o) => o.valor === selected);
      if (opt) precioExtra += opt.precio_extra;
    }
  });

  const totalPrice = basePrice + precioExtra;

  const handleStockNotif = async () => {
    if (!stockNotifEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stockNotifEmail)) {
      toast.error("Ingresa un email valido");
      return;
    }
    setStockNotifSending(true);
    try {
      const res = await fetch("/api/notificaciones-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto_id: producto.id, email: stockNotifEmail }),
      });
      if (res.ok) {
        toast.success("Te avisaremos cuando vuelva a estar disponible");
        setStockNotifDone(true);
      } else {
        toast.error("Error al suscribirse");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setStockNotifSending(false);
  };
  const mainImage = producto.imagenes?.[0];

  const handleAddToCart = () => {
    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: basePrice,
      imagen: mainImage?.url || "",
      slug: producto.slug,
      categoria_slug: categoriaSlug,
      variante: Object.keys(selectedVariants).length > 0 ? selectedVariants : null,
      precio_extra: precioExtra,
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) {
      toast.error("Selecciona una calificacion");
      return;
    }
    if (!reviewComentario.trim()) {
      toast.error("Escribe un comentario");
      return;
    }
    if (!reviewNombre.trim() || !reviewEmail.trim()) {
      toast.error("Nombre y email son obligatorios");
      return;
    }

    setReviewSending(true);
    try {
      const res = await fetch(`/api/productos/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          titulo: reviewTitulo || null,
          comentario: reviewComentario,
          autor_nombre: reviewNombre,
          autor_email: reviewEmail,
        }),
      });

      if (res.ok) {
        toast.success("Tu opinion fue enviada y sera revisada pronto");
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewTitulo("");
        setReviewComentario("");
        setReviewNombre("");
        setReviewEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al enviar opinion");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setReviewSending(false);
  };

  const handleSubmitPregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preguntaTexto.trim() || !preguntaNombre.trim() || !preguntaEmail.trim()) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    setPreguntaSending(true);
    try {
      const res = await fetch(`/api/productos/${slug}/preguntas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta: preguntaTexto,
          autor_nombre: preguntaNombre,
          autor_email: preguntaEmail,
          cliente_id: user?.id || null,
        }),
      });
      if (res.ok) {
        toast.success("Tu pregunta fue enviada y sera respondida pronto");
        setShowPreguntaForm(false);
        setPreguntaTexto("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al enviar pregunta");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setPreguntaSending(false);
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion || producto.descripcion_corta || "",
    image: producto.imagenes?.map((img) => img.url).filter(Boolean) || [],
    sku: producto.sku || undefined,
    brand: {
      "@type": "Brand",
      name: "PrintUp",
    },
    offers: {
      "@type": "Offer",
      price: basePrice,
      priceCurrency: "CLP",
      availability: producto.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "PrintUp",
      },
      priceValidUntil: "2027-12-31",
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    category: catName,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumb
        items={[
          { label: "Productos", href: "/productos" },
          { label: catName, href: `/productos/${categoriaSlug}` },
          { label: producto.nombre },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Image gallery with lightbox */}
        <ProductGallery
          images={producto.imagenes}
          productName={producto.nombre}
        />

        {/* Product info */}
        <div>
          {/* Category + badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Link href={`/productos/${categoriaSlug}`} className="text-sm text-[#00B4D8] hover:underline">
              {catName}
            </Link>
            {hasOffer && (
              <Badge className="bg-[#F97316] text-white border-0">Oferta</Badge>
            )}
            {producto.precio_m2 && producto.precio_m2 > 0 && (
              <Badge className="bg-[#10b981] text-white border-0">Precio por m²</Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-3" style={{ letterSpacing: "-0.02em" }}>
            {producto.nombre}
          </h1>

          {/* Short description */}
          {producto.descripcion_corta && (
            <p className="text-[#64748B] mb-4 leading-relaxed">{producto.descripcion_corta}</p>
          )}

          {/* Reviews summary inline */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRatingDisplay rating={Math.round(avgRating)} />
              <span className="text-xs text-[#64748B]">({reviews.length} opinion{reviews.length !== 1 ? "es" : ""})</span>
            </div>
          )}

          {/* ============ M² PRODUCTS (inline summary only — full calculator below grid) ============ */}
          {producto.precio_m2 && producto.precio_m2 > 0 ? (
            <div ref={ctaRef} className="mb-6 space-y-4">
              {/* Price display - "desde" style */}
              <div>
                <p className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Precio base</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-[#64748B]">desde</span>
                  <span className="text-[36px] font-extrabold text-[#1B2A6B] leading-none">
                    {formatCLP(producto.precio_m2)}
                  </span>
                  <span className="text-sm text-[#64748B] font-medium">/ m²</span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Precio base del producto. El total final depende de tus medidas y terminaciones.
                </p>
              </div>

              {/* Tiempo de produccion */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F0F7FF] border border-[#E2E8F0]">
                <Clock className="size-4 text-[#8b5cf6] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">Tiempo de produccion</p>
                  <p className="text-xs text-[#64748B]">Te confirmamos el plazo al cotizar. El plazo exacto se confirma cuando recibimos pago y archivo.</p>
                </div>
              </div>

              {/* Contact cards */}
              <div className="space-y-2">
                <a
                  href={`https://wa.me/56966126645?text=${encodeURIComponent(`Hola PrintUp! Quiero cotizar: ${producto.nombre}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <MessageCircle className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B] group-hover:text-[#25D366]">WhatsApp +56 9 66126645</p>
                    <p className="text-xs text-[#64748B]">Lun-Vie 09:00-18:00 · Sab 10:00-14:00</p>
                  </div>
                </a>
                <a
                  href="mailto:contacto@printup.cl"
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E2E8F0] hover:border-[#00B4D8] hover:bg-[#00B4D8]/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00B4D8] flex items-center justify-center shrink-0">
                    <Send className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B] group-hover:text-[#00B4D8]">contacto@printup.cl</p>
                    <p className="text-xs text-[#64748B]">Te respondemos en menos de 2 horas</p>
                  </div>
                </a>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-lg bg-[#F0F7FF] border border-[#E2E8F0]">
                  <p className="text-lg font-extrabold text-[#1B2A6B]">+500</p>
                  <p className="text-[10px] text-[#64748B] leading-tight">clientes confian</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#F0F7FF] border border-[#E2E8F0]">
                  <p className="text-lg font-extrabold text-[#1B2A6B]">+2.000</p>
                  <p className="text-[10px] text-[#64748B] leading-tight">trabajos entregados</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#F0F7FF] border border-[#E2E8F0]">
                  <p className="text-lg font-extrabold text-[#1B2A6B]">24h</p>
                  <p className="text-[10px] text-[#64748B] leading-tight">respuesta garantizada</p>
                </div>
              </div>

              {/* CTA: scroll to calculator */}
              <button
                onClick={() => document.getElementById("calculadora-m2")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="w-full py-3.5 rounded-xl bg-[#1B2A6B] text-white font-bold text-sm hover:bg-[#152259] transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Layers className="size-4" />
                Cotizar con medidas exactas
              </button>
              <a
                href={`https://wa.me/56966126645?text=${encodeURIComponent(`Hola PrintUp! Quiero cotizar: ${producto.nombre}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1ebe5a] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.666-5.895-1.803l-.422-.262-2.753.871.912-2.686-.29-.44A9.712 9.712 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                Cotizar por WhatsApp
              </a>
            </div>
          ) : (
            /* ============ STANDARD PRODUCTS: QTY + PRICE + ADD TO CART ============ */
            <div ref={ctaRef}>
              {/* Price display */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-[40px] font-extrabold text-[#1B2A6B] leading-none">
                  {formatCLP(totalPrice)}
                </span>
                {hasOffer && (
                  <span className="text-lg text-[#64748B] line-through">
                    {formatCLP(producto.precio)}
                  </span>
                )}
              </div>

              {/* Quantity Pricing Table */}
              {preciosCantidad.length > 0 && (
                <div className="mb-6 rounded-xl border border-[#E2E8F0] overflow-hidden">
                  <div className="bg-[#1B2A6B] px-4 py-2">
                    <p className="text-sm font-bold text-white">Precios por cantidad</p>
                  </div>
                  <div className="bg-white">
                    <div className="grid grid-cols-3 gap-1 text-xs font-semibold text-[#64748B] uppercase tracking-wider px-4 py-2 border-b border-[#E2E8F0]">
                      <span>Cantidad</span>
                      <span>Precio Unit.</span>
                      <span>Ahorro</span>
                    </div>
                    {preciosCantidad.map((tier, i) => {
                      const isActive =
                        cantidad >= tier.cantidad_min &&
                        (tier.cantidad_max === null || cantidad <= tier.cantidad_max);
                      const ahorro =
                        normalPrice > tier.precio
                          ? Math.round(((normalPrice - tier.precio) / normalPrice) * 100)
                          : 0;
                      return (
                        <div
                          key={i}
                          className={`grid grid-cols-3 gap-1 py-2.5 px-4 text-sm transition-colors ${
                            isActive
                              ? "bg-[#1B2A6B] text-white font-semibold"
                              : i % 2 === 0 ? "bg-white text-[#1E293B]" : "bg-[#F8F8F8] text-[#1E293B]"
                          }`}
                        >
                          <span>
                            {tier.cantidad_min}
                            {tier.cantidad_max ? `-${tier.cantidad_max}` : "+"}
                          </span>
                          <span>{formatCLP(tier.precio)}</span>
                          <span>
                            {ahorro > 0 ? (
                              <span className={isActive ? "text-green-300" : "text-green-600 font-semibold"}>
                                -{ahorro}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Variants */}
              {producto.variantes && producto.variantes.length > 0 && (
                <div className="space-y-4 mb-6">
                  {producto.variantes.map((variante) => (
                    <div key={variante.nombre}>
                      <label className="text-sm font-semibold text-[#1E293B] mb-2 block">
                        {variante.nombre}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {variante.opciones.map((opt) => (
                          <button
                            key={opt.valor}
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [variante.nombre]: opt.valor,
                              }))
                            }
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                              selectedVariants[variante.nombre] === opt.valor
                                ? "border-[#1B2A6B] bg-[#1B2A6B] text-white shadow-md"
                                : "border-[#E2E8F0] text-[#1E293B] hover:border-[#00B4D8] hover:shadow-sm"
                            }`}
                          >
                            {opt.valor}
                            {opt.precio_extra > 0 && (
                              <span className="ml-1 text-xs opacity-70">
                                (+{formatCLP(opt.precio_extra)})
                              </span>
                            )}
                            {opt.precio_extra < 0 && (
                              <span className="ml-1 text-xs text-green-400">
                                ({formatCLP(opt.precio_extra)})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 mb-3">
                <QuantitySelector
                  value={cantidad}
                  onChange={setCantidad}
                  max={producto.stock}
                />
                <Button
                  onClick={handleAddToCart}
                  disabled={producto.stock === 0}
                  className="flex-1 bg-[#1B2A6B] hover:bg-[#152259] text-white font-bold py-6"
                  size="lg"
                >
                  <ShoppingCart className="size-5 mr-2" />
                  {producto.stock === 0 ? "Agotado" : "Agregar al Carrito"}
                </Button>
              </div>

              {/* WhatsApp cotizar button - always visible like ChileImprime */}
              <a
                href={`https://wa.me/56966126645?text=${encodeURIComponent(`Hola PrintUp! Quiero cotizar: ${producto.nombre} - Cantidad: ${cantidad} - Precio: ${formatCLP(totalPrice)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#1ebe5a] transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.666-5.895-1.803l-.422-.262-2.753.871.912-2.686-.29-.44A9.712 9.712 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/></svg>
                Cotizar por WhatsApp
              </a>
            </div>
          )}

          {/* === Below sections only for STANDARD products (m² gets full-width versions after grid) === */}
          {!(producto.precio_m2 && producto.precio_m2 > 0) && (
          <>
          {/* Personalizar button */}
          <Button
            variant="outline"
            className="w-full gap-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10 mb-4"
            nativeButton={false}
            render={<Link href={`/productos/${categoriaSlug}/${slug}/personalizar`} />}
          >
            <Palette className="size-5" />
            Personalizar este producto
          </Button>

          {/* Trust / Benefit Badges - ChileImprime style */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F0F7FF] border border-[#E2E8F0] text-center">
              <div className="w-9 h-9 rounded-full bg-[#00B4D8]/10 flex items-center justify-center">
                <Truck className="size-4 text-[#00B4D8]" />
              </div>
              <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">Despacho Rapido</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F0F7FF] border border-[#E2E8F0] text-center">
              <div className="w-9 h-9 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                <Shield className="size-4 text-[#10b981]" />
              </div>
              <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">Calidad Garantizada</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#F0F7FF] border border-[#E2E8F0] text-center">
              <div className="w-9 h-9 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                <Headphones className="size-4 text-[#8b5cf6]" />
              </div>
              <span className="text-[10px] font-semibold text-[#1E293B] leading-tight">Soporte WhatsApp</span>
            </div>
          </div>

          {/* Que incluye - ChileImprime "Incluye" section */}
          {producto.incluye && producto.incluye.length > 0 && (
            <div className="mb-5 rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="bg-gradient-to-r from-[#1B2A6B] to-[#00355a] px-4 py-2.5 flex items-center gap-2">
                <Package className="size-4 text-[#00B4D8]" />
                <span className="text-sm font-bold text-white">Que incluye</span>
              </div>
              <div className="bg-white p-4">
                <ul className="space-y-2.5">
                  {producto.incluye.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#10b981]/10 flex items-center justify-center shrink-0">
                        <Check className="size-3.5 text-[#10b981]" />
                      </div>
                      <span className="text-sm text-[#1E293B] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Feature highlights for physical products */}
          {!producto.precio_m2 && (
            <div className="flex flex-wrap gap-3 mb-5">
              {producto.peso_gramos && producto.peso_gramos < 5000 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                  <Zap className="size-3" />
                  Liviano y portable
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                <Award className="size-3" />
                Impresion profesional
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-700">
                <Clock className="size-3" />
                Entrega en 24-48h
              </div>
            </div>
          )}

          {/* Stock info + SKU + Category */}
          <div className="flex items-center gap-4 text-sm text-[#64748B] mb-4 flex-wrap">
            {producto.stock > 0 ? (
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 status-dot-open" />
                {producto.stock} en stock
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Sin stock
              </span>
            )}
            {producto.sku && (
              <span>SKU: <strong className="text-[#1E293B]">{producto.sku}</strong></span>
            )}
          </div>

          {/* Stock notification */}
          {producto.stock === 0 && !stockNotifDone && (
            <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="size-4 text-orange-500" />
                <span className="text-sm font-semibold text-[#1E293B]">
                  Avisame cuando vuelva
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={stockNotifEmail}
                  onChange={(e) => setStockNotifEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                />
                <Button
                  onClick={handleStockNotif}
                  disabled={stockNotifSending}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
                  size="sm"
                >
                  {stockNotifSending ? "..." : "Notificarme"}
                </Button>
              </div>
            </div>
          )}
          {stockNotifDone && (
            <div className="mb-6 p-3 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700">
              Te avisaremos cuando este producto vuelva a estar disponible.
            </div>
          )}

          {/* Compact info - full tabs are in the section below */}
          <div className="border-t border-[#E2E8F0] pt-6" id="product-info-tabs">
            <div className="flex gap-1 mb-0 overflow-x-auto">
              {(["descripcion", "especificaciones", "envio", "preguntas"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                    activeTab === tab
                      ? "bg-[#E91E8C] text-white shadow-md"
                      : "bg-[#F0F7FF] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1E293B]"
                  }`}
                >
                  {tab === "descripcion" ? "Descripcion" : tab === "especificaciones" ? "Detalles" : tab === "envio" ? "Envio" : `Preguntas${preguntas.length > 0 ? ` (${preguntas.length})` : ""}`}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-b-xl rounded-tr-xl border border-[#E2E8F0] p-6">
            {activeTab === "descripcion" && (
              <div className="text-sm text-[#1E293B] leading-relaxed space-y-6">
                {/* Main description HTML */}
                {producto.descripcion ? (
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-[#1E293B] prose-headings:font-bold prose-p:text-[#1E293B] prose-strong:text-[#1B2A6B] prose-li:text-[#1E293B] prose-a:text-[#00B4D8] prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: producto.descripcion }}
                  />
                ) : (
                  <p className="text-[#64748B]">Sin descripcion disponible.</p>
                )}

                {/* Caracteristicas principales - ChileImprime style */}
                {producto.caracteristicas && producto.caracteristicas.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center">
                        <Sparkles className="size-4 text-[#1B2A6B]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Caracteristicas principales</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {producto.caracteristicas.map((car, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-[#F0F7FF] rounded-lg border border-[#E2E8F0]">
                          <div className="w-6 h-6 rounded-full bg-[#00B4D8]/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="size-3.5 text-[#00B4D8]" />
                          </div>
                          <span className="text-sm text-[#1E293B] leading-snug">{car}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usos y aplicaciones - ChileImprime style */}
                {producto.usos && producto.usos.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                        <Target className="size-4 text-[#10b981]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Usos y aplicaciones</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {producto.usos.map((uso, i) => (
                        <div key={i} className="flex items-center gap-2.5 py-2 px-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
                          <span className="text-sm text-[#1E293B]">{uso}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Machine info for m² products */}
                {producto.precio_m2 && producto.precio_m2 > 0 && (
                  <div className="p-5 bg-gradient-to-br from-[#F0F7FF] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                        <Layers className="size-4 text-[#8b5cf6]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Informacion de impresion</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                        <p className="text-xs text-[#64748B] mb-1">Precio por m²</p>
                        <p className="text-lg font-bold text-[#1B2A6B]">{formatCLP(producto.precio_m2)}</p>
                      </div>
                      {producto.ancho_max_cm && (
                        <div className="text-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                          <p className="text-xs text-[#64748B] mb-1">Ancho maximo</p>
                          <p className="text-lg font-bold text-[#1B2A6B]">{producto.ancho_max_cm} cm</p>
                        </div>
                      )}
                      {producto.area_min_cm2 && (
                        <div className="text-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                          <p className="text-xs text-[#64748B] mb-1">Area minima</p>
                          <p className="text-lg font-bold text-[#1B2A6B]">{producto.area_min_cm2} cm²</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Que incluye - inline in description tab too */}
                {producto.incluye && producto.incluye.length > 0 && (
                  <div className="p-5 bg-gradient-to-br from-[#ecfdf5] to-white rounded-xl border border-[#d1fae5]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                        <Package className="size-4 text-[#10b981]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Que incluye tu pedido</h3>
                    </div>
                    <ul className="space-y-2">
                      {producto.incluye.map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="size-4 text-[#10b981] shrink-0" />
                          <span className="text-sm text-[#1E293B]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Como funciona - for m² products */}
                {producto.precio_m2 && producto.precio_m2 > 0 && (
                  <div className="p-5 bg-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center">
                        <Wrench className="size-4 text-[#1B2A6B]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Como funciona?</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { step: "1", title: "Cotiza con medidas reales", desc: "Pones ancho, alto y cuantos necesitas. El cotizador te muestra el precio al instante." },
                        { step: "2", title: "Te confirmamos por WhatsApp o email", desc: "En menos de 2 horas habiles. Revisamos tu archivo, confirmamos el plazo real y la forma de pago." },
                        { step: "3", title: "Imprimimos y avisamos", desc: "Cuando este listo te avisamos para retiro en Donihue o despacho coordinado." },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#1B2A6B] text-white flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                          <div>
                            <p className="font-semibold text-sm text-[#1E293B]">{s.title}</p>
                            <p className="text-sm text-[#64748B]">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                        className="px-5 py-2.5 rounded-xl bg-[#1B2A6B] text-white text-sm font-bold hover:bg-[#152259] transition-colors"
                      >
                        Ir al cotizador
                      </button>
                      <a
                        href="https://wa.me/56966126645?text=Hola%20PrintUp,%20quiero%20saber%20los%20requisitos%20del%20archivo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-sm font-medium hover:bg-[#F0F7FF] transition-colors"
                      >
                        Consultar requisitos del archivo
                      </a>
                    </div>
                  </div>
                )}

                {/* Por que elegir PrintUp - always show */}
                <div className="p-5 bg-gradient-to-br from-[#eff6ff] to-[#f0f7ff] rounded-xl border border-[#dbeafe]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center">
                      <Award className="size-4 text-[#1B2A6B]" />
                    </div>
                    <h3 className="text-base font-bold text-[#1E293B]">Por que elegir PrintUp</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Eye, text: "Impresion en alta resolucion con colores vibrantes y durables" },
                      { icon: Shield, text: "Materiales de primera calidad, resistentes a UV y agua" },
                      { icon: Clock, text: "Entrega rapida: 24 a 48 horas habiles en la mayoria de productos" },
                      { icon: Headphones, text: "Soporte por WhatsApp para resolver cualquier duda de tu proyecto" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <item.icon className="size-4 text-[#00B4D8] mt-0.5 shrink-0" />
                        <span className="text-sm text-[#64748B] leading-snug">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "especificaciones" && (
              <div className="space-y-6">
                {/* Professional spec table */}
                <SpecTable
                  specs={[
                    ...(producto.sku ? [{ label: "SKU", value: producto.sku }] : []),
                    ...(producto.peso_gramos ? [{ label: "Peso", value: `${producto.peso_gramos}g` }] : []),
                    ...(producto.tags.length > 0 ? [{ label: "Etiquetas", value: producto.tags.join(", ") }] : []),
                    ...(producto.precio_m2 ? [{ label: "Precio por m²", value: formatCLP(producto.precio_m2) }] : []),
                    ...(producto.ancho_max_cm ? [{ label: "Ancho maximo", value: `${producto.ancho_max_cm}cm` }] : []),
                    ...(producto.especificaciones || []).map((e: { label: string; value: string }) => ({
                      label: e.label,
                      value: e.value,
                    })),
                  ]}
                  title="Especificaciones Tecnicas"
                />

                {/* Fallback if no specs */}
                {!producto.sku && !producto.peso_gramos && producto.tags.length === 0 && !(producto.especificaciones?.length) && (
                  <p className="text-sm text-[#64748B]">Sin especificaciones disponibles.</p>
                )}
              </div>
            )}

            {activeTab === "envio" && (
              <div className="text-sm text-[#1E293B] space-y-5">
                {/* Tiempos de produccion */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                      <Clock className="size-3.5 text-[#8b5cf6]" />
                    </div>
                    <h4 className="font-bold text-[#1E293B]">Tiempos de produccion</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs text-[#64748B] mb-0.5">Productos estandar</p>
                      <p className="font-semibold text-[#1E293B]">24 a 48 horas habiles</p>
                    </div>
                    <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#E2E8F0]">
                      <p className="text-xs text-[#64748B] mb-0.5">Gran formato / m²</p>
                      <p className="font-semibold text-[#1E293B]">48 a 72 horas habiles</p>
                    </div>
                  </div>
                </div>

                {/* Despacho */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center">
                      <Truck className="size-3.5 text-[#00B4D8]" />
                    </div>
                    <h4 className="font-bold text-[#1E293B]">Despacho a domicilio</h4>
                  </div>
                  <div className="space-y-2 ml-9">
                    <p className="text-[#64748B]"><strong className="text-[#1E293B]">Dias:</strong> Miercoles y Viernes</p>
                    <p className="text-[#64748B]">Zona 1 (Donihue, Coltauco, Coinco): <strong className="text-[#1E293B]">$3.500</strong></p>
                    <p className="text-[#64748B]">Zona 2 (Rancagua, Machali, Olivar): <strong className="text-[#1E293B]">$4.500</strong></p>
                    <p className="text-[#10b981] font-medium">Envio gratis en pedidos sobre $50.000</p>
                  </div>
                </div>

                {/* Retiro */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                      <Package className="size-3.5 text-[#10b981]" />
                    </div>
                    <h4 className="font-bold text-[#1E293B]">Retiro en tienda</h4>
                  </div>
                  <div className="ml-9 space-y-1">
                    <p className="text-[#64748B]">Errazuriz 09 / Francisco Lira 082, Donihue</p>
                    <p className="text-[#64748B]">Lun-Vie 9:00-18:00 / Sab 10:00-14:00</p>
                    <p className="text-[#10b981] font-medium">Sin costo</p>
                  </div>
                </div>

                {/* Requisitos de archivos */}
                <div className="p-4 bg-[#FFF7ED] rounded-lg border border-[#FFEDD5]">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="size-4 text-[#F59E0B]" />
                    <h4 className="font-bold text-[#92400E]">Requisitos de archivos</h4>
                  </div>
                  <ul className="space-y-1.5 text-sm text-[#92400E]/80">
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-1">•</span>
                      Formatos aceptados: PDF, AI, PSD, JPG, PNG, TIFF, SVG, EPS
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-1">•</span>
                      Resolucion recomendada: 150 DPI para gran formato, 300 DPI para pequeno formato
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-1">•</span>
                      Modo de color: CMYK preferido, tambien aceptamos RGB
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-1">•</span>
                      Tamano maximo de archivo: 50 MB por archivo
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "preguntas" && (
              <div className="space-y-4">
                {preguntasLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                ) : (
                  <>
                    {preguntas.length > 0 ? (
                      <div className="space-y-4">
                        {preguntas.map((q) => (
                          <div key={q.id} className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
                            <div className="flex items-start gap-2 mb-2">
                              <MessageCircle className="size-4 text-[#1B2A6B] mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-[#1E293B]">{q.pregunta}</p>
                                <p className="text-xs text-[#64748B] mt-1">
                                  {q.autor_nombre} - {new Date(q.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                            {q.respuesta && (
                              <div className="ml-6 mt-2 p-3 bg-[#F0F7FF] rounded-lg">
                                <p className="text-sm text-[#1E293B]">{q.respuesta}</p>
                                <p className="text-xs text-[#00B4D8] font-medium mt-1">
                                  PrintUp - {q.respuesta_at && new Date(q.respuesta_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#64748B]">
                        Aun no hay preguntas. Se el primero en preguntar.
                      </p>
                    )}

                    {!showPreguntaForm ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowPreguntaForm(true)}
                        className="gap-2"
                      >
                        <MessageCircle className="size-4" />
                        Hacer una pregunta
                      </Button>
                    ) : (
                      <form
                        onSubmit={handleSubmitPregunta}
                        className="p-6 bg-white rounded-xl border border-[#E2E8F0] space-y-4"
                      >
                        <h3 className="font-bold text-[#1E293B]">Tu pregunta</h3>
                        <div>
                          <label className="text-sm font-semibold text-[#1E293B] block mb-1">
                            Pregunta
                          </label>
                          <textarea
                            value={preguntaTexto}
                            onChange={(e) => setPreguntaTexto(e.target.value)}
                            placeholder="Que te gustaria saber sobre este producto?"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-[#1E293B] block mb-1">Nombre</label>
                            <input
                              type="text"
                              value={preguntaNombre}
                              onChange={(e) => setPreguntaNombre(e.target.value)}
                              placeholder="Tu nombre"
                              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-[#1E293B] block mb-1">Email</label>
                            <input
                              type="email"
                              value={preguntaEmail}
                              onChange={(e) => setPreguntaEmail(e.target.value)}
                              placeholder="tu@email.com"
                              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-[#64748B]">Tu pregunta sera respondida y publicada pronto.</p>
                        <div className="flex gap-3">
                          <Button
                            type="submit"
                            disabled={preguntaSending}
                            className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white"
                          >
                            <Send className="size-4" />
                            {preguntaSending ? "Enviando..." : "Enviar pregunta"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPreguntaForm(false)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </div>
            )}
            </div>{/* close tab content panel */}
          </div>

          {/* Ficha tecnica download */}
          {producto.ficha_tecnica_url && (
            <div className="mt-4">
              <a
                href={producto.ficha_tecnica_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F0F7FF] border border-[#E2E8F0] text-sm font-medium text-[#1B2A6B] hover:bg-[#E0EFFF] transition-colors"
              >
                <FileDown className="size-4" />
                Descargar Ficha Tecnica (PDF)
              </a>
            </div>
          )}

          {/* Product meta - Category & Tags (WooCommerce style) */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Folder className="size-3.5 shrink-0" />
              <span>Categoria:</span>
              <Link href={`/productos/${categoriaSlug}`} className="text-[#00B4D8] hover:underline font-medium">
                {catName}
              </Link>
            </div>
            {producto.tags.length > 0 && (
              <div className="flex items-start gap-2 text-[#64748B]">
                <Tag className="size-3.5 shrink-0 mt-0.5" />
                <span>Etiquetas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {producto.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/productos?search=${encodeURIComponent(tag)}`}
                      className="px-2 py-0.5 rounded bg-[#F0F7FF] text-[#00B4D8] text-xs font-medium hover:bg-[#E0EFFF] transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* ============ FULL-WIDTH SECTIONS FOR M² PRODUCTS ============ */}
      {producto.precio_m2 && producto.precio_m2 > 0 && (
        <>
          {/* Personalizar button - full width */}
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full max-w-md gap-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10"
              nativeButton={false}
              render={<Link href={`/productos/${categoriaSlug}/${slug}/personalizar`} />}
            >
              <Palette className="size-5" />
              Personalizar este producto
            </Button>
          </div>

          {/* Trust badges - full width 3-col */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0F7FF] border border-[#E2E8F0] text-center">
              <div className="w-10 h-10 rounded-full bg-[#00B4D8]/10 flex items-center justify-center">
                <Truck className="size-5 text-[#00B4D8]" />
              </div>
              <span className="text-xs font-semibold text-[#1E293B]">Despacho Rapido</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0F7FF] border border-[#E2E8F0] text-center">
              <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                <Shield className="size-5 text-[#10b981]" />
              </div>
              <span className="text-xs font-semibold text-[#1E293B]">Calidad Garantizada</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#F0F7FF] border border-[#E2E8F0] text-center">
              <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                <Headphones className="size-5 text-[#8b5cf6]" />
              </div>
              <span className="text-xs font-semibold text-[#1E293B]">Soporte WhatsApp</span>
            </div>
          </div>

          {/* Que incluye - full width */}
          {producto.incluye && producto.incluye.length > 0 && (
            <div className="mb-8 rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="bg-gradient-to-r from-[#1B2A6B] to-[#00355a] px-5 py-3 flex items-center gap-2">
                <Package className="size-4 text-[#00B4D8]" />
                <span className="text-sm font-bold text-white">Que incluye</span>
              </div>
              <div className="bg-white p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {producto.incluye.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#ecfdf5] rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-[#10b981]/15 flex items-center justify-center shrink-0">
                        <Check className="size-3.5 text-[#10b981]" />
                      </div>
                      <span className="text-sm text-[#1E293B] font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TABS - full width for m² products */}
          <div className="mb-8" id="product-info-tabs-m2">
            <div className="flex gap-1 mb-0 overflow-x-auto">
              {(["descripcion", "especificaciones", "envio", "preguntas"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap rounded-t-xl ${
                    activeTab === tab
                      ? "bg-[#E91E8C] text-white shadow-md"
                      : "bg-[#F0F7FF] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1E293B]"
                  }`}
                >
                  {tab === "descripcion" ? "Descripcion" : tab === "especificaciones" ? "Detalles" : tab === "envio" ? "Envio" : `Preguntas${preguntas.length > 0 ? ` (${preguntas.length})` : ""}`}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-b-xl rounded-tr-xl border border-[#E2E8F0] p-6 md:p-8">
              {activeTab === "descripcion" && (
                <div className="text-sm text-[#1E293B] leading-relaxed space-y-6">
                  {producto.descripcion ? (
                    <div
                      className="prose prose-sm max-w-none prose-headings:text-[#1E293B] prose-headings:font-bold prose-p:text-[#1E293B] prose-strong:text-[#1B2A6B] prose-li:text-[#1E293B] prose-a:text-[#00B4D8] prose-img:rounded-xl"
                      dangerouslySetInnerHTML={{ __html: producto.descripcion }}
                    />
                  ) : (
                    <p className="text-[#64748B]">Sin descripcion disponible.</p>
                  )}

                  {producto.caracteristicas && producto.caracteristicas.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center">
                          <Sparkles className="size-4 text-[#1B2A6B]" />
                        </div>
                        <h3 className="text-base font-bold text-[#1E293B]">Caracteristicas principales</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {producto.caracteristicas.map((car, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-[#F0F7FF] rounded-lg border border-[#E2E8F0]">
                            <div className="w-6 h-6 rounded-full bg-[#00B4D8]/15 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="size-3.5 text-[#00B4D8]" />
                            </div>
                            <span className="text-sm text-[#1E293B] leading-snug">{car}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {producto.usos && producto.usos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                          <Target className="size-4 text-[#10b981]" />
                        </div>
                        <h3 className="text-base font-bold text-[#1E293B]">Usos y aplicaciones</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {producto.usos.map((uso, i) => (
                          <div key={i} className="flex items-center gap-2.5 py-2 px-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
                            <span className="text-sm text-[#1E293B]">{uso}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-gradient-to-br from-[#F0F7FF] to-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                        <Layers className="size-4 text-[#8b5cf6]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Informacion de impresion</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                        <p className="text-xs text-[#64748B] mb-1">Precio por m²</p>
                        <p className="text-lg font-bold text-[#1B2A6B]">{formatCLP(producto.precio_m2!)}</p>
                      </div>
                      {producto.ancho_max_cm && (
                        <div className="text-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                          <p className="text-xs text-[#64748B] mb-1">Ancho maximo</p>
                          <p className="text-lg font-bold text-[#1B2A6B]">{producto.ancho_max_cm} cm</p>
                        </div>
                      )}
                      {producto.area_min_cm2 && (
                        <div className="text-center p-3 bg-white rounded-lg border border-[#E2E8F0]">
                          <p className="text-xs text-[#64748B] mb-1">Area minima</p>
                          <p className="text-lg font-bold text-[#1B2A6B]">{producto.area_min_cm2} cm²</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {producto.incluye && producto.incluye.length > 0 && (
                    <div className="p-5 bg-gradient-to-br from-[#ecfdf5] to-white rounded-xl border border-[#d1fae5]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                          <Package className="size-4 text-[#10b981]" />
                        </div>
                        <h3 className="text-base font-bold text-[#1E293B]">Que incluye tu pedido</h3>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {producto.incluye.map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <Check className="size-4 text-[#10b981] shrink-0" />
                            <span className="text-sm text-[#1E293B]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-5 bg-white rounded-xl border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center">
                        <Wrench className="size-4 text-[#1B2A6B]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Como funciona?</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { step: "1", title: "Cotiza con medidas reales", desc: "Pones ancho, alto y cuantos necesitas. El cotizador te muestra el precio al instante." },
                        { step: "2", title: "Te confirmamos por WhatsApp o email", desc: "En menos de 2 horas habiles. Revisamos tu archivo, confirmamos el plazo real y la forma de pago." },
                        { step: "3", title: "Imprimimos y avisamos", desc: "Cuando este listo te avisamos para retiro en Donihue o despacho coordinado." },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3 p-4 bg-[#F0F7FF] rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-[#1B2A6B] text-white flex items-center justify-center text-sm font-bold shrink-0">{s.step}</div>
                          <div>
                            <p className="font-semibold text-sm text-[#1E293B]">{s.title}</p>
                            <p className="text-sm text-[#64748B]">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => document.getElementById("calculadora-m2")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="px-5 py-2.5 rounded-xl bg-[#1B2A6B] text-white text-sm font-bold hover:bg-[#152259] transition-colors"
                      >
                        Ir al cotizador
                      </button>
                      <a
                        href="https://wa.me/56966126645?text=Hola%20PrintUp,%20quiero%20saber%20los%20requisitos%20del%20archivo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-sm font-medium hover:bg-[#F0F7FF] transition-colors"
                      >
                        Consultar requisitos del archivo
                      </a>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-[#eff6ff] to-[#f0f7ff] rounded-xl border border-[#dbeafe]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2A6B]/10 flex items-center justify-center">
                        <Award className="size-4 text-[#1B2A6B]" />
                      </div>
                      <h3 className="text-base font-bold text-[#1E293B]">Por que elegir PrintUp</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: Eye, text: "Impresion en alta resolucion con colores vibrantes y durables" },
                        { icon: Shield, text: "Materiales de primera calidad, resistentes a UV y agua" },
                        { icon: Clock, text: "Entrega rapida: 24 a 48 horas habiles en la mayoria de productos" },
                        { icon: Headphones, text: "Soporte por WhatsApp para resolver cualquier duda de tu proyecto" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <item.icon className="size-4 text-[#00B4D8] mt-0.5 shrink-0" />
                          <span className="text-sm text-[#64748B] leading-snug">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "especificaciones" && (
                <div className="space-y-6">
                  <SpecTable
                    specs={[
                      ...(producto.sku ? [{ label: "SKU", value: producto.sku }] : []),
                      ...(producto.peso_gramos ? [{ label: "Peso", value: `${producto.peso_gramos}g` }] : []),
                      ...(producto.tags.length > 0 ? [{ label: "Etiquetas", value: producto.tags.join(", ") }] : []),
                      ...(producto.precio_m2 ? [{ label: "Precio por m²", value: formatCLP(producto.precio_m2) }] : []),
                      ...(producto.ancho_max_cm ? [{ label: "Ancho maximo", value: `${producto.ancho_max_cm}cm` }] : []),
                      ...(producto.especificaciones || []).map((e: { label: string; value: string }) => ({
                        label: e.label,
                        value: e.value,
                      })),
                    ]}
                    title="Especificaciones Tecnicas"
                  />
                  {!producto.sku && !producto.peso_gramos && producto.tags.length === 0 && !(producto.especificaciones?.length) && (
                    <p className="text-sm text-[#64748B]">Sin especificaciones disponibles.</p>
                  )}
                </div>
              )}

              {activeTab === "envio" && (
                <div className="text-sm text-[#1E293B] space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                        <Clock className="size-3.5 text-[#8b5cf6]" />
                      </div>
                      <h4 className="font-bold text-[#1E293B]">Tiempos de produccion</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#E2E8F0]">
                        <p className="text-xs text-[#64748B] mb-0.5">Productos estandar</p>
                        <p className="font-semibold text-[#1E293B]">24 a 48 horas habiles</p>
                      </div>
                      <div className="p-3 bg-[#F0F7FF] rounded-lg border border-[#E2E8F0]">
                        <p className="text-xs text-[#64748B] mb-0.5">Gran formato / m²</p>
                        <p className="font-semibold text-[#1E293B]">48 a 72 horas habiles</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#00B4D8]/10 flex items-center justify-center">
                        <Truck className="size-3.5 text-[#00B4D8]" />
                      </div>
                      <h4 className="font-bold text-[#1E293B]">Despacho a domicilio</h4>
                    </div>
                    <div className="space-y-2 ml-9">
                      <p className="text-[#64748B]"><strong className="text-[#1E293B]">Dias:</strong> Miercoles y Viernes</p>
                      <p className="text-[#64748B]">Zona 1 (Donihue, Coltauco, Coinco): <strong className="text-[#1E293B]">$3.500</strong></p>
                      <p className="text-[#64748B]">Zona 2 (Rancagua, Machali, Olivar): <strong className="text-[#1E293B]">$4.500</strong></p>
                      <p className="text-[#10b981] font-medium">Envio gratis en pedidos sobre $50.000</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                        <Package className="size-3.5 text-[#10b981]" />
                      </div>
                      <h4 className="font-bold text-[#1E293B]">Retiro en tienda</h4>
                    </div>
                    <div className="ml-9 space-y-1">
                      <p className="text-[#64748B]">Errazuriz 09 / Francisco Lira 082, Donihue</p>
                      <p className="text-[#64748B]">Lun-Vie 9:00-18:00 / Sab 10:00-14:00</p>
                      <p className="text-[#10b981] font-medium">Sin costo</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#FFF7ED] rounded-lg border border-[#FFEDD5]">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="size-4 text-[#F59E0B]" />
                      <h4 className="font-bold text-[#92400E]">Requisitos de archivos</h4>
                    </div>
                    <ul className="space-y-1.5 text-sm text-[#92400E]/80">
                      <li className="flex items-start gap-2"><span className="text-[#F59E0B] mt-1">•</span>Formatos aceptados: PDF, AI, PSD, JPG, PNG, TIFF, SVG, EPS</li>
                      <li className="flex items-start gap-2"><span className="text-[#F59E0B] mt-1">•</span>Resolucion recomendada: 150 DPI para gran formato, 300 DPI para pequeno formato</li>
                      <li className="flex items-start gap-2"><span className="text-[#F59E0B] mt-1">•</span>Modo de color: CMYK preferido, tambien aceptamos RGB</li>
                      <li className="flex items-start gap-2"><span className="text-[#F59E0B] mt-1">•</span>Tamano maximo de archivo: 50 MB por archivo</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "preguntas" && (
                <div className="space-y-4">
                  {preguntasLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 rounded-lg" />
                      <Skeleton className="h-16 rounded-lg" />
                    </div>
                  ) : (
                    <>
                      {preguntas.length > 0 ? (
                        <div className="space-y-4">
                          {preguntas.map((q) => (
                            <div key={q.id} className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
                              <div className="flex items-start gap-2 mb-2">
                                <MessageCircle className="size-4 text-[#1B2A6B] mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-[#1E293B]">{q.pregunta}</p>
                                  <p className="text-xs text-[#64748B] mt-1">
                                    {q.autor_nombre} - {new Date(q.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              </div>
                              {q.respuesta && (
                                <div className="ml-6 mt-2 p-3 bg-[#F0F7FF] rounded-lg">
                                  <p className="text-sm text-[#1E293B]">{q.respuesta}</p>
                                  <p className="text-xs text-[#00B4D8] font-medium mt-1">
                                    PrintUp - {q.respuesta_at && new Date(q.respuesta_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#64748B]">Aun no hay preguntas. Se el primero en preguntar.</p>
                      )}

                      {!showPreguntaForm ? (
                        <Button variant="outline" onClick={() => setShowPreguntaForm(true)} className="gap-2">
                          <MessageCircle className="size-4" />
                          Hacer una pregunta
                        </Button>
                      ) : (
                        <form onSubmit={handleSubmitPregunta} className="p-6 bg-white rounded-xl border border-[#E2E8F0] space-y-4">
                          <h3 className="font-bold text-[#1E293B]">Tu pregunta</h3>
                          <div>
                            <label className="text-sm font-semibold text-[#1E293B] block mb-1">Pregunta</label>
                            <textarea value={preguntaTexto} onChange={(e) => setPreguntaTexto(e.target.value)} placeholder="Que te gustaria saber sobre este producto?" rows={3} className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm resize-none" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-[#1E293B] block mb-1">Nombre</label>
                              <input type="text" value={preguntaNombre} onChange={(e) => setPreguntaNombre(e.target.value)} placeholder="Tu nombre" className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm" />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-[#1E293B] block mb-1">Email</label>
                              <input type="email" value={preguntaEmail} onChange={(e) => setPreguntaEmail(e.target.value)} placeholder="tu@email.com" className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm" />
                            </div>
                          </div>
                          <p className="text-xs text-[#64748B]">Tu pregunta sera respondida y publicada pronto.</p>
                          <div className="flex gap-3">
                            <Button type="submit" disabled={preguntaSending} className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white">
                              <Send className="size-4" />
                              {preguntaSending ? "Enviando..." : "Enviar pregunta"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowPreguntaForm(false)}>Cancelar</Button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ficha tecnica download - full width */}
          {producto.ficha_tecnica_url && (
            <div className="mb-6">
              <a href={producto.ficha_tecnica_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#F0F7FF] border border-[#E2E8F0] text-sm font-medium text-[#1B2A6B] hover:bg-[#E0EFFF] transition-colors">
                <FileDown className="size-4" />
                Descargar Ficha Tecnica (PDF)
              </a>
            </div>
          )}

          {/* Product meta - Category & Tags - full width */}
          <div className="mb-8 pt-5 border-t border-[#E2E8F0] space-y-2 text-sm">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Folder className="size-3.5 shrink-0" />
              <span>Categoria:</span>
              <Link href={`/productos/${categoriaSlug}`} className="text-[#00B4D8] hover:underline font-medium">{catName}</Link>
            </div>
            {producto.tags.length > 0 && (
              <div className="flex items-start gap-2 text-[#64748B]">
                <Tag className="size-3.5 shrink-0 mt-0.5" />
                <span>Etiquetas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {producto.tags.map((tag) => (
                    <Link key={tag} href={`/productos?search=${encodeURIComponent(tag)}`} className="px-2 py-0.5 rounded bg-[#F0F7FF] text-[#00B4D8] text-xs font-medium hover:bg-[#E0EFFF] transition-colors">{tag}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ FULL-WIDTH CALCULATOR for m² products ============ */}
      {producto.precio_m2 && producto.precio_m2 > 0 && (
        <section className="mb-16" id="calculadora-m2">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            {/* Calculator - main area */}
            <PriceCalculator
              precioM2={producto.precio_m2}
              anchoMaxCm={producto.ancho_max_cm || 300}
              altoMaxCm={producto.alto_max_cm || 0}
              areaMinCm2={producto.area_min_cm2 || 900}
              materiales={producto.materiales_calculadora || []}
              acabados={producto.acabados_calculadora || []}
              productoNombre={producto.nombre}
            />

            {/* Sidebar - quick info */}
            <div className="space-y-4">
              {/* Trust badges vertical */}
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="bg-gradient-to-r from-[#1B2A6B] to-[#00355a] px-4 py-2.5">
                  <p className="text-xs font-bold text-white">Por que elegirnos</p>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  {[
                    { icon: Shield, text: "Materiales de primera calidad", sub: "Resistentes a UV y agua" },
                    { icon: Clock, text: "Entrega rapida", sub: "24-48h habiles la mayoria" },
                    { icon: Headphones, text: "Soporte directo", sub: "WhatsApp en horario laboral" },
                    { icon: Award, text: "Garantia de color", sub: "Impresion 1440 DPI calibrada" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F0F7FF] flex items-center justify-center shrink-0">
                        <item.icon className="size-4 text-[#00B4D8]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1E293B]">{item.text}</p>
                        <p className="text-[10px] text-[#64748B]">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Que incluye - sidebar */}
              {producto.incluye && producto.incluye.length > 0 && (
                <div className="rounded-xl border border-[#d1fae5] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#059669] to-[#10b981] px-4 py-2.5">
                    <p className="text-xs font-bold text-white">Que incluye tu pedido</p>
                  </div>
                  <div className="p-4 bg-[#ecfdf5] space-y-2">
                    {producto.incluye.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="size-3.5 text-[#10b981] shrink-0" />
                        <span className="text-xs text-[#1E293B]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              <div className="p-4 bg-[#FFF7ED] rounded-xl border border-[#FFEDD5]">
                <p className="text-xs font-semibold text-[#92400E] mb-2">Requisitos del archivo:</p>
                <ul className="text-[10px] text-[#92400E]/80 space-y-1">
                  <li>• Resolucion: 150 DPI para gran formato</li>
                  <li>• Modo de color: CMYK preferido</li>
                  <li>• Formatos: PDF, AI, PSD, JPG o PNG</li>
                  <li>• Tamano real 1:1 con 3mm de sangria</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ ANTES DE COTIZAR - FAQ ============ */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-[#00B4D8] uppercase tracking-wider mb-2">Antes de cotizar</p>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Lo que siempre nos preguntan
          </h2>
          <p className="text-sm text-[#64748B]">
            4 respuestas directas para que no pierdas tiempo. Si tienes otra duda, escribenos por WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              emoji: "⏱️",
              pregunta: "En cuanto tiempo lo tengo listo?",
              respuesta: "El plazo depende del producto. Productos estandar: 24-48h habiles. Gran formato: 48-72h. El plazo exacto se confirma cuando recibimos el pago y el archivo.",
            },
            {
              emoji: "📁",
              pregunta: "Como les envio mi diseno?",
              respuesta: "Lo subes en nuestra pagina de contacto (PDF, JPG, PNG o TIFF). Te confirmamos si se vera nitido al tamano real. Si no sabes exportar, sube el archivo como este y te ayudamos.",
            },
            {
              emoji: "💳",
              pregunta: "Como pago?",
              respuesta: "Aceptamos transferencia bancaria y efectivo. El pago se coordina al confirmar la cotizacion y se realiza antes de imprimir. Sin cobro online ni sorpresas.",
            },
            {
              emoji: "🏬",
              pregunta: "Puedo ver el material antes?",
              respuesta: "Si. Pasa por nuestro taller en Errazuriz 09, Donihue. Lun-Vie 09:00-18:00 · Sab 10:00-14:00. Te mostramos muestras fisicas.",
            },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-white rounded-xl border border-[#E2E8F0] hover:border-[#00B4D8]/30 transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div>
                  <p className="font-bold text-[#1E293B] text-sm mb-1.5">{item.pregunta}</p>
                  <p className="text-sm text-[#64748B] leading-relaxed">{item.respuesta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-[#64748B] mb-3">Otra duda? Te respondemos en menos de 2 horas habiles.</p>
          <a
            href="https://wa.me/56966126645?text=Hola%20PrintUp,%20tengo%20una%20consulta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe5a] transition-colors"
          >
            <MessageCircle className="size-4" />
            Preguntar por WhatsApp
          </a>
        </div>
      </section>

      {/* ============ COTIZA AL INSTANTE - Process Steps ============ */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-[#00B4D8] uppercase tracking-wider mb-2">Cotiza al instante</p>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#1E293B] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Pon tus medidas y te damos el precio
          </h2>
          <p className="text-sm text-[#64748B]">
            Tu escribes cuanto mide y cuantos quieres. Te damos el precio real, sin compromiso.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              step: "1",
              title: "Pon tus medidas",
              desc: "Ancho y alto en cm. Si no sabes, escribenos y te ayudamos.",
              color: "#00B4D8",
            },
            {
              step: "2",
              title: "Sube tu diseno",
              desc: "PDF, JPG o PNG. Te avisamos si queda nitido para ese tamano.",
              color: "#8b5cf6",
            },
            {
              step: "3",
              title: "Dejanos tu dato",
              desc: "Nombre y correo o WhatsApp para enviarte la cotizacion.",
              color: "#FF9710",
            },
            {
              step: "4",
              title: "Recibe tu precio",
              desc: "Te confirmamos precio, plazo y coordinamos pago.",
              color: "#10b981",
            },
          ].map((item) => (
            <div key={item.step} className="relative text-center p-5 rounded-xl bg-white border border-[#E2E8F0]">
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: item.color }}
              >
                {item.step}
              </div>
              <h3 className="font-bold text-[#1E293B] text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* Reviews Section */}
      <section className="mb-16">
        <h2
          className="text-xl font-extrabold text-[#1E293B] mb-6"
          style={{ letterSpacing: "-0.02em" }}
        >
          Opiniones de Clientes
        </h2>

        {reviewsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-64 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Average rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-[#E2E8F0]">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-[#1B2A6B]">
                    {avgRating.toFixed(1)}
                  </div>
                  <StarRatingDisplay rating={Math.round(avgRating)} size="lg" />
                  <p className="text-xs text-[#64748B] mt-1">
                    {reviews.length} opinion{reviews.length !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 ? (
              <div className="space-y-4 mb-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-white rounded-xl border border-[#E2E8F0]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <StarRatingDisplay rating={review.rating} />
                      {review.verificada && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-[#00B4D8]/10 text-[#00B4D8]">
                          Compra verificada
                        </span>
                      )}
                    </div>
                    {review.titulo && (
                      <p className="font-semibold text-sm text-[#1E293B] mb-1">
                        {review.titulo}
                      </p>
                    )}
                    <p className="text-sm text-[#1E293B] leading-relaxed mb-2">
                      {review.comentario}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span>{review.autor_nombre}</span>
                      <span>-</span>
                      <span>
                        {new Date(review.created_at).toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748B] mb-4">
                Se el primero en opinar sobre este producto.
              </p>
            )}

            {/* Write review button / form */}
            {!showReviewForm ? (
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(true)}
                className="gap-2"
              >
                <Star className="size-4" />
                Escribir una opinion
              </Button>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                className="p-6 bg-white rounded-xl border border-[#E2E8F0] space-y-4"
              >
                <h3 className="font-bold text-[#1E293B]">Tu opinion</h3>

                {/* Star selector */}
                <div>
                  <label className="text-sm font-semibold text-[#1E293B] block mb-2">
                    Calificacion
                  </label>
                  <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-semibold text-[#1E293B] block mb-1">
                    Titulo (opcional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitulo}
                    onChange={(e) => setReviewTitulo(e.target.value)}
                    placeholder="Resume tu experiencia"
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="text-sm font-semibold text-[#1E293B] block mb-1">
                    Comentario
                  </label>
                  <textarea
                    value={reviewComentario}
                    onChange={(e) => setReviewComentario(e.target.value)}
                    placeholder="Cuentanos que te parecio el producto..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm resize-none"
                  />
                </div>

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={reviewNombre}
                      onChange={(e) => setReviewNombre(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#1E293B] block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={reviewSending}
                    className="gap-2 bg-[#1B2A6B] hover:bg-[#152259] text-white"
                  >
                    <Send className="size-4" />
                    {reviewSending ? "Enviando..." : "Enviar opinion"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {/* Related Products */}
      {relacionados.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-[#1E293B] mb-6" style={{ letterSpacing: "-0.02em" }}>
            Productos Relacionados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relacionados.map((prod) => (
              <ProductCard key={prod.id} producto={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile add-to-cart bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-[#E2E8F0] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            {/* Mini product info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#64748B] truncate">{producto.nombre}</p>
              <p className="text-lg font-extrabold text-[#1B2A6B] leading-tight">
                {producto.precio_m2 && producto.precio_m2 > 0
                  ? `Desde ${formatCLP(producto.precio_m2)}/m²`
                  : formatCLP(totalPrice)
                }
              </p>
            </div>
            {/* CTA */}
            {producto.precio_m2 && producto.precio_m2 > 0 ? (
              <button
                onClick={() => {
                  ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="shrink-0 px-5 py-3 rounded-xl bg-[#1B2A6B] text-white text-sm font-bold flex items-center gap-2"
              >
                <ChevronUp className="size-4" />
                Cotizar
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={producto.stock === 0}
                className="shrink-0 px-5 py-3 rounded-xl bg-[#1B2A6B] text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2"
              >
                <ShoppingCart className="size-4" />
                Agregar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

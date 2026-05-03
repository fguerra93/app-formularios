"use client";

import { useEffect, useState } from "react";
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
import { ShoppingCart, Package, Truck, Info, Star, Send, Bell, MessageCircle, FileDown, Palette } from "lucide-react";
import { toast } from "sonner";
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
    image: mainImage?.url || undefined,
    sku: producto.sku || undefined,
    offers: {
      "@type": "Offer",
      price: basePrice,
      priceCurrency: "CLP",
      availability: producto.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
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
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-xl bg-white border border-[#E2E8F0] overflow-hidden flex items-center justify-center">
            {mainImage?.url ? (
              <img
                src={mainImage.url}
                alt={mainImage.alt || producto.nombre}
                className="w-full h-full object-contain"
              />
            ) : (
              <Package className="size-24 text-[#00B4D8]/20" />
            )}
          </div>
          {producto.imagenes.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {producto.imagenes.map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-white border border-[#E2E8F0] overflow-hidden cursor-pointer hover:border-[#00B4D8] transition-colors"
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.alt || `${producto.nombre} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="size-6 text-[#00B4D8]/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[#64748B]">{catName}</span>
            {hasOffer && (
              <Badge className="bg-[#F97316] text-white border-0">Oferta</Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mb-4" style={{ letterSpacing: "-0.02em" }}>
            {producto.nombre}
          </h1>

          {producto.descripcion_corta && (
            <p className="text-[#64748B] mb-4">{producto.descripcion_corta}</p>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-extrabold text-[#1B2A6B]">
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
            <div className="mb-6 p-4 bg-[#F0F7FF] rounded-xl border border-[#E2E8F0]">
              <p className="text-sm font-semibold text-[#1B2A6B] mb-3">Precios por cantidad</p>
              <div className="grid grid-cols-3 gap-1 text-xs font-medium text-[#64748B] mb-2">
                <span>Cantidad</span>
                <span>Precio Unitario</span>
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
                    className={`grid grid-cols-3 gap-1 py-2 px-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-[#1B2A6B] text-white font-semibold"
                        : "text-[#1E293B]"
                    }`}
                  >
                    <span>
                      {tier.cantidad_min}
                      {tier.cantidad_max ? `-${tier.cantidad_max}` : "+"}
                    </span>
                    <span>{formatCLP(tier.precio)}</span>
                    <span>
                      {ahorro > 0 ? (
                        <span className={isActive ? "text-green-300" : "text-green-600"}>
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          selectedVariants[variante.nombre] === opt.valor
                            ? "border-[#1B2A6B] bg-[#1B2A6B] text-white"
                            : "border-[#E2E8F0] text-[#1E293B] hover:border-[#00B4D8]"
                        }`}
                      >
                        {opt.valor}
                        {opt.precio_extra > 0 && (
                          <span className="ml-1 text-xs opacity-70">
                            (+{formatCLP(opt.precio_extra)})
                          </span>
                        )}
                        {opt.precio_extra < 0 && (
                          <span className="ml-1 text-xs text-green-600">
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
          <div className="flex items-center gap-4 mb-6">
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

          {/* Stock info */}
          <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
            {producto.stock > 0 ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {producto.stock} en stock
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Sin stock
              </>
            )}
            {producto.sku && (
              <span className="ml-4">SKU: {producto.sku}</span>
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

          {/* Tabs */}
          <div className="border-t border-[#E2E8F0] pt-6">
            <div className="flex gap-4 border-b border-[#E2E8F0] mb-4 overflow-x-auto">
              {(["descripcion", "especificaciones", "envio", "preguntas"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab
                      ? "border-[#1B2A6B] text-[#1B2A6B]"
                      : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  {tab === "descripcion" ? "Descripcion" : tab === "especificaciones" ? "Especificaciones" : tab === "envio" ? "Envio" : `Preguntas${preguntas.length > 0 ? ` (${preguntas.length})` : ""}`}
                </button>
              ))}
            </div>

            {activeTab === "descripcion" && (
              <div className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">
                {producto.descripcion || "Sin descripcion disponible."}
              </div>
            )}

            {activeTab === "especificaciones" && (
              <div className="text-sm text-[#1E293B] space-y-2">
                {producto.peso_gramos && (
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-[#64748B]" />
                    Peso: {producto.peso_gramos}g
                  </div>
                )}
                {producto.sku && (
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-[#64748B]" />
                    SKU: {producto.sku}
                  </div>
                )}
                {producto.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Info className="size-4 text-[#64748B]" />
                    Tags: {producto.tags.join(", ")}
                  </div>
                )}
              </div>
            )}

            {activeTab === "envio" && (
              <div className="text-sm text-[#1E293B] space-y-3">
                <div className="flex items-start gap-2">
                  <Truck className="size-4 text-[#00B4D8] mt-0.5" />
                  <div>
                    <p className="font-medium">Despachos Miercoles y Viernes</p>
                    <p className="text-[#64748B]">Zona 1 (Donihue, Coltauco, Coinco): $3.500</p>
                    <p className="text-[#64748B]">Zona 2 (Rancagua, Machali, Olivar): $4.500</p>
                    <p className="text-[#64748B]">Envio gratis sobre $50.000</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="size-4 text-[#00B4D8] mt-0.5" />
                  <div>
                    <p className="font-medium">Retiro en tienda</p>
                    <p className="text-[#64748B]">Errazuriz 09, Donihue - Gratis</p>
                  </div>
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
        </div>
      </div>

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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { QuantitySelector } from "@/components/tienda/quantity-selector";
import { ProductCard } from "@/components/tienda/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Truck, Info } from "lucide-react";
import type { Producto } from "@/lib/types";

export default function ProductoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const categoriaSlug = params.categoria as string;
  const { addItem } = useCart();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"descripcion" | "especificaciones" | "envio">("descripcion");

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
  const basePrice = hasOffer ? producto.precio_oferta! : producto.precio;

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

          {/* Tabs */}
          <div className="border-t border-[#E2E8F0] pt-6">
            <div className="flex gap-4 border-b border-[#E2E8F0] mb-4">
              {(["descripcion", "especificaciones", "envio"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-[#1B2A6B] text-[#1B2A6B]"
                      : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  {tab === "descripcion" ? "Descripcion" : tab === "especificaciones" ? "Especificaciones" : "Envio"}
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
          </div>
        </div>
      </div>

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

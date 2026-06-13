"use client";

import Link from "next/link";
import { ShoppingCart, Package, Heart, Star } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { formatCLP } from "@/lib/format";
import { ProductBadges } from "./product-badge";
import type { Producto, Categoria } from "@/lib/types";

interface ProductCardProps {
  producto: Producto & { categoria?: Categoria };
  rating?: number;
  reviewCount?: number;
}

export function ProductCard({ producto, rating, reviewCount }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const categoriaSlug = producto.categoria?.slug || "productos";
  const hasOffer = producto.precio_oferta !== null && producto.precio_oferta < producto.precio;
  const displayPrice = hasOffer ? producto.precio_oferta! : producto.precio;
  const mainImage = producto.imagenes?.[0];
  const wishlisted = isInWishlist(producto.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: displayPrice,
      imagen: mainImage?.url || "",
      slug: producto.slug,
      categoria_slug: categoriaSlug,
      variante: null,
      precio_extra: 0,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(producto.id);
  };

  return (
    <Link
      href={`/productos/${categoriaSlug}/${producto.slug}`}
      className="mc-card mc-card-hover mc-cropmarks group block overflow-hidden"
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden" style={{ background: "var(--mc-surface)" }}>
        {mainImage?.url ? (
          <img
            src={mainImage.url}
            alt={mainImage.alt || producto.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="size-14" style={{ color: "var(--mc-ink-3)" }} />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <ProductBadges producto={producto} />
        </div>

        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute top-3 right-3 flex items-center justify-center size-9 rounded-full bg-white/90 backdrop-blur border border-[#e8eaee] hover:bg-white transition-colors"
        >
          <Heart className={`size-[18px] transition-colors ${wishlisted ? "fill-[#e11d48] text-[#e11d48]" : "text-[#5b6472]"}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "var(--mc-ink-3)" }}>
          {producto.categoria?.nombre || "Producto"}
        </p>

        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${i < Math.round(rating) ? "fill-[#f5a623] text-[#f5a623]" : "fill-none text-[#d7dbe2]"}`}
              />
            ))}
            {reviewCount !== undefined && reviewCount > 0 && (
              <span className="text-xs ml-0.5" style={{ color: "var(--mc-ink-3)" }}>({reviewCount})</span>
            )}
          </div>
        )}

        <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 min-h-[2.5rem]" style={{ color: "var(--mc-ink)" }}>
          {producto.nombre}
        </h3>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="mc-tech text-xl font-bold" style={{ color: "var(--mc-ink)" }}>
            {formatCLP(displayPrice)}
          </span>
          {hasOffer && (
            <span className="text-sm line-through" style={{ color: "var(--mc-ink-3)" }}>
              {formatCLP(producto.precio)}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={producto.stock === 0}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="mc-btn mc-btn-primary flex-1 py-2.5"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            {producto.stock === 0 ? "Agotado" : "Agregar"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(
                `https://wa.me/56966126645?text=${encodeURIComponent(`Hola PrintUp! Me interesa: ${producto.nombre} - ${formatCLP(displayPrice)}`)}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            aria-label={`Cotizar ${producto.nombre} por WhatsApp`}
            title="Cotizar por WhatsApp"
            className="w-11 shrink-0 inline-flex items-center justify-center rounded-[11px] border border-[#25D366]/45 bg-[#25D366]/8 text-[#1ebe5a] transition-colors hover:bg-[#25D366] hover:text-white"
          >
            <svg className="size-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.666-5.895-1.803l-.422-.262-2.753.871.912-2.686-.29-.44A9.712 9.712 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

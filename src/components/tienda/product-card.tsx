"use client";

import Link from "next/link";
import { ShoppingCart, Package, Heart, Star, MessageCircle } from "lucide-react";
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
            className="mc-btn mc-btn-ghost w-11 px-0 shrink-0"
          >
            <MessageCircle className="size-4 text-[#25D366]" />
          </button>
        </div>
      </div>
    </Link>
  );
}

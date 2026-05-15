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
      className="group block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover-glow transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#F0F7FF] overflow-hidden">
        {mainImage?.url ? (
          <img
            src={mainImage.url}
            alt={mainImage.alt || producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="size-16 text-[#00B4D8]/30" />
          </div>
        )}

        {/* Ver detalles overlay */}
        <div className="absolute inset-0 bg-[#1B2A6B]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="text-white text-sm font-semibold tracking-wide">Ver detalles</span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <ProductBadges producto={producto} />
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/70 hover:bg-white transition-all duration-200"
        >
          <Heart
            className={`size-5 transition-all duration-200 ${
              wishlisted
                ? "fill-red-500 text-red-500"
                : "text-white drop-shadow"
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-[#64748B] mb-1">
          {producto.categoria?.nombre || "Producto"}
        </p>

        {/* Rating */}
        {rating !== undefined && rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3 ${
                  i < Math.round(rating)
                    ? "fill-[#FFD100] text-[#FFD100]"
                    : "fill-none text-[#E2E8F0]"
                }`}
              />
            ))}
            {reviewCount !== undefined && reviewCount > 0 && (
              <span className="text-xs text-[#64748B] ml-0.5">
                ({reviewCount})
              </span>
            )}
          </div>
        )}

        <h3 className="font-semibold text-[#1E293B] text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-[#1B2A6B]">
            {formatCLP(displayPrice)}
          </span>
          {hasOffer && (
            <span className="text-sm text-[#64748B] line-through">
              {formatCLP(producto.precio)}
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={producto.stock === 0}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-[#1B2A6B] text-white hover:bg-[#152259] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:ring-offset-2"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
            {producto.stock === 0 ? "Agotado" : "Agregar al carrito"}
          </button>
          <a
            href={`https://wa.me/56966126645?text=${encodeURIComponent(`Hola PrintUp! Me interesa: ${producto.nombre} - ${formatCLP(displayPrice)}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Cotizar ${producto.nombre} por WhatsApp`}
            className="flex items-center justify-center w-11 rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe5a] hover:scale-[1.05] transition-all duration-200 shrink-0"
          >
            <MessageCircle className="size-4" />
          </a>
        </div>
      </div>
    </Link>
  );
}

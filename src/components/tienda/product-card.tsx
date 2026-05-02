"use client";

import Link from "next/link";
import { ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import type { Producto, Categoria } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  producto: Producto & { categoria?: Categoria };
}

export function ProductCard({ producto }: ProductCardProps) {
  const { addItem } = useCart();
  const categoriaSlug = producto.categoria?.slug || "productos";
  const hasOffer = producto.precio_oferta !== null && producto.precio_oferta < producto.precio;
  const displayPrice = hasOffer ? producto.precio_oferta! : producto.precio;
  const mainImage = producto.imagenes?.[0];

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

  return (
    <Link
      href={`/productos/${categoriaSlug}/${producto.slug}`}
      className="group block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-lg transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#F0F7FF] overflow-hidden">
        {mainImage?.url ? (
          <img
            src={mainImage.url}
            alt={mainImage.alt || producto.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="size-16 text-[#00B4D8]/30" />
          </div>
        )}
        {hasOffer && (
          <Badge className="absolute top-3 left-3 bg-[#F97316] text-white border-0">
            Oferta
          </Badge>
        )}
        {producto.stock === 0 && (
          <Badge className="absolute top-3 right-3 bg-gray-500 text-white border-0">
            Agotado
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-[#64748B] mb-1">
          {producto.categoria?.nombre || "Producto"}
        </p>
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
        <button
          onClick={handleAddToCart}
          disabled={producto.stock === 0}
          aria-label={`Agregar ${producto.nombre} al carrito`}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-[#1B2A6B] text-white hover:bg-[#152259] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:ring-offset-2"
        >
          <ShoppingCart className="size-4" aria-hidden="true" />
          {producto.stock === 0 ? "Agotado" : "Agregar al carrito"}
        </button>
      </div>
    </Link>
  );
}

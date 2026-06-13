import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatCLP } from "@/lib/format";
import type { Producto, Categoria } from "@/lib/types";

/**
 * Tile editorial para "Productos destacados": foto a sangre bajo velo de tinta,
 * nombre en tipografía de afiche y precio tabular. El contenido va en absoluto
 * sobre la imagen, así que el tile llena cualquier alto de celda sin recortes.
 *
 * - variant="hero"    → tile grande (col/row-span-2).
 * - variant="compact" → tile chico para las celdas de la grilla bento.
 */
export function FeaturedProduct({
  producto,
  variant = "hero",
}: {
  producto: Producto & { categoria?: Categoria };
  variant?: "hero" | "compact";
}) {
  const categoriaSlug = producto.categoria?.slug || "productos";
  const hasOffer = producto.precio_oferta !== null && producto.precio_oferta < producto.precio;
  const displayPrice = hasOffer ? producto.precio_oferta! : producto.precio;
  const esM2 = !!(producto.precio_m2 && producto.precio_m2 > 0);
  const img = producto.imagenes?.[0]?.url || "";
  const compact = variant === "compact";

  return (
    <Link
      href={`/productos/${categoriaSlug}/${producto.slug}`}
      className={`group relative block h-full overflow-hidden bg-[#0a0b0d] ${
        compact ? "min-h-[200px]" : "min-h-[340px]"
      }`}
    >
      {img && (
        <img
          src={img}
          alt={producto.nombre}
          className="absolute inset-0 size-full object-cover opacity-85 transition-all duration-700 group-hover:scale-[1.05] group-hover:opacity-100"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(10,11,13,.93) 0%, rgba(10,11,13,.4) 50%, rgba(10,11,13,.05) 100%)",
        }}
      />

      {/* Etiqueta destacado (solo hero) */}
      {!compact && (
        <span className="absolute left-4 top-4 z-10 inline-flex items-center bg-[var(--mc-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
          Lo más pedido
        </span>
      )}

      <div className={`relative z-10 flex h-full flex-col justify-end ${compact ? "p-4" : "p-6"}`}>
        <span
          className={`mc-tech uppercase tracking-[0.14em] text-white/60 ${
            compact ? "mb-1 text-[10px]" : "mb-1.5 text-[11px]"
          }`}
        >
          {producto.categoria?.nombre || "Producto"}
        </span>
        <h3
          className={`pl-poster text-white ${
            compact
              ? "max-w-[16ch] text-xl leading-[0.98]"
              : "max-w-[14ch] text-3xl leading-[0.95] md:text-4xl"
          }`}
        >
          {producto.nombre}
        </h3>

        <div className={`flex items-center justify-between gap-2 ${compact ? "mt-2.5" : "mt-4 gap-3"}`}>
          <span className={`mc-tech font-bold text-white ${compact ? "text-base" : "text-2xl"}`}>
            {esM2 ? "desde " : ""}
            {formatCLP(esM2 ? producto.precio_m2! : displayPrice)}
            {esM2 && (
              <span className={`font-medium text-white/60 ${compact ? "text-xs" : "text-sm"}`}>/m²</span>
            )}
          </span>
          {compact ? (
            <span className="inline-flex size-8 shrink-0 items-center justify-center bg-white text-[#0f1115] transition-colors group-hover:bg-[var(--mc-accent)] group-hover:text-white">
              <ArrowUpRight className="size-4" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-bold text-[#0f1115] transition-colors group-hover:bg-[var(--mc-accent)] group-hover:text-white">
              Ver producto
              <ArrowUpRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="mc-cmyk absolute inset-x-0 bottom-0 z-10 opacity-80" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
    </Link>
  );
}

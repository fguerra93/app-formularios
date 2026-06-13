import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Categoria } from "@/lib/types";

interface CategoryCardProps {
  categoria: Categoria;
  productCount?: number;
  /** Mosaico destacado (más grande) en la grilla editorial. */
  featured?: boolean;
}

// Foto representativa por categoría (el seed inserta las categorías sin
// imagen_url). Son trabajos reales del taller — nada de stock genérico.
const CATEGORIA_IMG: Record<string, string> = {
  "pendones-y-banderas":
    "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/Pendongenerico-tumarcaaqui.png?v=1768931843",
  "transferibles":
    "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/DTFTEXTIL2.jpg?v=1768931472&width=1200",
  "poleras-personalizadas":
    "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/POLERA.png?v=1768926587",
  "grafica-publicitaria":
    "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/IMG_20250515_103817.jpg?v=1773951352&width=1200",
  "articulos-publicitarios":
    "https://cdn.shopify.com/s/files/1/0865/0077/0149/files/BOTELLA-MODELO-2.png?v=1770159452",
};

export function CategoryCard({ categoria, productCount, featured = false }: CategoryCardProps) {
  const img = categoria.imagen_url || CATEGORIA_IMG[categoria.slug] || "";

  return (
    <Link
      href={`/productos/${categoria.slug}`}
      className={`group relative block h-full overflow-hidden bg-[#0a0b0d] ${
        featured ? "min-h-[300px] lg:min-h-full" : "min-h-[210px]"
      }`}
    >
      {/* Foto del trabajo */}
      {img ? (
        <img
          src={img}
          alt={categoria.nombre}
          className="absolute inset-0 size-full object-cover opacity-80 transition-all duration-700 group-hover:scale-[1.06] group-hover:opacity-100"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#0f1d5e,#00b4d8)" }} />
      )}

      {/* Velo de tinta para que el texto siempre lea */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(10,11,13,.92) 0%, rgba(10,11,13,.45) 45%, rgba(10,11,13,.08) 100%)",
        }}
      />

      {/* Línea de acento que se dibuja al hover (top) */}
      <span className="absolute left-0 top-0 h-[3px] w-0 bg-[var(--mc-accent)] transition-all duration-500 group-hover:w-full" />

      {/* Contenido */}
      <div className="relative z-10 flex h-full flex-col justify-end p-5">
        <span className="mc-tech mb-2 text-[10px] uppercase tracking-[0.16em] text-white/55">
          {productCount !== undefined && productCount > 0
            ? `${productCount} ${productCount === 1 ? "producto" : "productos"}`
            : "Ver catálogo"}
        </span>
        <div className="flex items-end justify-between gap-3">
          <h3
            className={`pl-poster text-white leading-[0.92] ${
              featured ? "text-4xl md:text-5xl" : "text-2xl"
            }`}
          >
            {categoria.nombre}
          </h3>
          <span className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors group-hover:border-white group-hover:bg-white group-hover:text-[#0f1115]">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>

      {/* Registro CMYK al pie — firma del oficio */}
      <div className="mc-cmyk absolute inset-x-0 bottom-0 z-10 opacity-80" aria-hidden="true">
        <i /><i /><i /><i />
      </div>
    </Link>
  );
}

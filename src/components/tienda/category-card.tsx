import Link from "next/link";
import { FolderOpen, ArrowRight } from "lucide-react";
import type { Categoria } from "@/lib/types";

interface CategoryCardProps {
  categoria: Categoria;
  productCount?: number;
}

export function CategoryCard({ categoria, productCount }: CategoryCardProps) {
  return (
    <Link
      href={`/productos/${categoria.slug}`}
      className="mc-card mc-card-hover group block overflow-hidden"
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: "var(--mc-surface)" }}>
        {categoria.imagen_url ? (
          <img
            src={categoria.imagen_url}
            alt={categoria.nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="size-12" style={{ color: "var(--mc-ink-3)" }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate" style={{ color: "var(--mc-ink)" }}>
            {categoria.nombre}
          </h3>
          {productCount !== undefined && productCount > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "var(--mc-ink-3)" }}>
              {productCount} {productCount === 1 ? "producto" : "productos"}
            </p>
          )}
        </div>
        <span
          className="flex items-center justify-center size-8 rounded-full shrink-0 transition-colors group-hover:bg-[#0f1115] group-hover:text-white"
          style={{ border: "1px solid var(--mc-line-2)", color: "var(--mc-ink)" }}
        >
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

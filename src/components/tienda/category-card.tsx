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
      className="group relative block rounded-xl overflow-hidden aspect-[4/3] bg-[#1B2A6B] hover-glow"
    >
      {categoria.imagen_url ? (
        <img
          src={categoria.imagen_url}
          alt={categoria.nombre}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          <FolderOpen className="size-16 text-white/20" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end p-4 md:p-5">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base md:text-lg leading-tight">
              {categoria.nombre}
            </h3>
            {productCount !== undefined && productCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold shrink-0">
                {productCount}
              </span>
            )}
          </div>
          {categoria.descripcion && (
            <p className="text-white/60 text-xs md:text-sm mt-1 line-clamp-2">
              {categoria.descripcion}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-[#00B4D8] text-xs font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Ver productos <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Bottom accent line on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00B4D8] to-[#FF9710] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  );
}

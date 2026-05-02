import Link from "next/link";
import { FolderOpen } from "lucide-react";
import type { Categoria } from "@/lib/types";

interface CategoryCardProps {
  categoria: Categoria;
}

export function CategoryCard({ categoria }: CategoryCardProps) {
  return (
    <Link
      href={`/productos/${categoria.slug}`}
      className="group relative block rounded-xl overflow-hidden aspect-[4/3] bg-[#1B2A6B]"
    >
      {categoria.imagen_url ? (
        <img
          src={categoria.imagen_url}
          alt={categoria.nombre}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B2A6B] to-[#00B4D8] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          <FolderOpen className="size-16 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 flex items-end p-5">
        <div>
          <h3 className="text-white font-bold text-lg leading-tight">
            {categoria.nombre}
          </h3>
          {categoria.descripcion && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">
              {categoria.descripcion}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

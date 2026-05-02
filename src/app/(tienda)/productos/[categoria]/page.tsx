"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/tienda/product-card";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Producto, Categoria } from "@/lib/types";

export default function CategoriaPage() {
  return (
    <Suspense>
      <CategoriaContent />
    </Suspense>
  );
}

function CategoriaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoriaSlug = params.categoria as string;

  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "created_at:desc";

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((data) => {
        const cats: Categoria[] = Array.isArray(data) ? data : [];
        const found = cats.find((c) => c.slug === categoriaSlug);
        setCategoria(found || null);
      });
  }, [categoriaSlug]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("categoria", categoriaSlug);
    params.set("page", String(page));
    params.set("sort", sort);

    fetch(`/api/productos?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProductos(data.productos || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [categoriaSlug, page, sort]);

  const catName = categoria?.nombre || categoriaSlug.replace(/-/g, " ");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Productos", href: "/productos" },
          { label: catName },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1E293B]" style={{ letterSpacing: "-0.02em" }}>
          {catName}
        </h1>
        {categoria?.descripcion && (
          <p className="text-[#64748B] mt-2">{categoria.descripcion}</p>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#64748B]">
          {total} producto{total !== 1 ? "s" : ""}
        </p>
        <select
          value={sort}
          onChange={(e) => {
            const p = new URLSearchParams(searchParams.toString());
            p.set("sort", e.target.value);
            p.set("page", "1");
            router.push(`/productos/${categoriaSlug}?${p}`);
          }}
          className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white"
        >
          <option value="created_at:desc">Mas recientes</option>
          <option value="precio:asc">Precio: menor a mayor</option>
          <option value="precio:desc">Precio: mayor a menor</option>
          <option value="nombre:asc">Nombre: A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#64748B] mb-4">No hay productos en esta categoria</p>
          <Button nativeButton={false} render={<Link href="/productos" />} variant="outline">
            Ver todos los productos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((prod) => (
            <ProductCard key={prod.id} producto={prod} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set("page", String(page - 1));
              router.push(`/productos/${categoriaSlug}?${p}`);
            }}
          >
            Anterior
          </Button>
          <span className="text-sm text-[#64748B] px-3">
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.set("page", String(page + 1));
              router.push(`/productos/${categoriaSlug}?${p}`);
            }}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

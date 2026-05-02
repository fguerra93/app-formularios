"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/tienda/product-card";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, PackageOpen } from "lucide-react";
import type { Producto, Categoria } from "@/lib/types";
import { StaggerContainer, StaggerItem } from "@/components/tienda/motion";

export default function CatalogoPage() {
  return (
    <Suspense>
      <CatalogoContent />
    </Suspense>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "created_at:desc";
  const search = searchParams.get("search") || "";
  const catFilter = searchParams.get("categoria") || "";

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((data) => setCategorias(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("sort", sort);
    if (search) params.set("search", search);
    if (catFilter) params.set("categoria", catFilter);

    fetch(`/api/productos?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProductos(data.productos || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, sort, search, catFilter]);

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.set("page", "1");
    router.push(`/productos?${params}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Productos" }]} />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <FilterPanel
            categorias={categorias}
            activeCat={catFilter}
            sort={sort}
            onCategoryChange={(c) => updateParams("categoria", c)}
            onSortChange={(s) => updateParams("sort", s)}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Search + mobile filter toggle */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => updateParams("search", e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>

          {/* Mobile filters */}
          {filtersOpen && (
            <div className="md:hidden mb-6 p-4 bg-white rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">Filtros</span>
                <button onClick={() => setFiltersOpen(false)}>
                  <X className="size-4" />
                </button>
              </div>
              <FilterPanel
                categorias={categorias}
                activeCat={catFilter}
                sort={sort}
                onCategoryChange={(c) => updateParams("categoria", c)}
                onSortChange={(s) => updateParams("sort", s)}
              />
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-[#64748B] mb-4">
            {total} producto{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F0F7FF] flex items-center justify-center">
                <PackageOpen className="size-8 text-[#00B4D8]" />
              </div>
              <h3 className="font-bold text-[#1E293B] mb-2">No encontramos productos</h3>
              <p className="text-sm text-[#64748B] mb-4">
                {search
                  ? `No hay resultados para "${search}". Intenta con otros terminos.`
                  : "No hay productos con los filtros seleccionados."}
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/productos")}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productos.map((prod) => (
                <StaggerItem key={prod.id}>
                  <ProductCard producto={prod} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams("page", String(page - 1))}
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
                onClick={() => updateParams("page", String(page + 1))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  categorias,
  activeCat,
  sort,
  onCategoryChange,
  onSortChange,
}: {
  categorias: Categoria[];
  activeCat: string;
  sort: string;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-[#1E293B] mb-3">Categorias</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onCategoryChange("")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !activeCat
                  ? "bg-[#1B2A6B] text-white font-medium"
                  : "text-[#64748B] hover:bg-gray-50"
              }`}
            >
              Todas
            </button>
          </li>
          {categorias.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onCategoryChange(cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCat === cat.slug
                    ? "bg-[#1B2A6B] text-white font-medium"
                    : "text-[#64748B] hover:bg-gray-50"
                }`}
              >
                {cat.nombre}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-bold text-[#1E293B] mb-3">Ordenar por</h3>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white"
        >
          <option value="created_at:desc">Mas recientes</option>
          <option value="precio:asc">Precio: menor a mayor</option>
          <option value="precio:desc">Precio: mayor a menor</option>
          <option value="nombre:asc">Nombre: A-Z</option>
        </select>
      </div>
    </div>
  );
}

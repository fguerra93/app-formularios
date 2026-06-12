"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductCard } from "@/components/tienda/product-card";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, PackageOpen, ShoppingBag } from "lucide-react";
import type { Producto, Categoria } from "@/lib/types";
import { StaggerContainer, StaggerItem } from "@/components/tienda/motion";
import { ModuleHero } from "@/components/tienda/module-hero";

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
  const precioMin = searchParams.get("precio_min") || "";
  const precioMax = searchParams.get("precio_max") || "";
  const enStock = searchParams.get("en_stock") === "1";
  const conDescuento = searchParams.get("con_descuento") === "1";
  const nuevos = searchParams.get("nuevos") === "1";

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
        let prods: Producto[] = data.productos || [];

        // Client-side filtering
        if (precioMin) {
          const min = Number(precioMin);
          prods = prods.filter(
            (p) => (p.precio_oferta ?? p.precio) >= min
          );
        }
        if (precioMax) {
          const max = Number(precioMax);
          prods = prods.filter(
            (p) => (p.precio_oferta ?? p.precio) <= max
          );
        }
        if (enStock) {
          prods = prods.filter((p) => p.stock > 0);
        }
        if (conDescuento) {
          prods = prods.filter(
            (p) => p.precio_oferta !== null && p.precio_oferta !== undefined
          );
        }
        if (nuevos) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          prods = prods.filter(
            (p) => new Date(p.created_at) >= thirtyDaysAgo
          );
        }

        setProductos(prods);
        setTotal(prods.length);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setLoading(false));
  }, [page, sort, search, catFilter, precioMin, precioMax, enStock, conDescuento, nuevos]);

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

  // Active filter chips
  const activeFilters: { label: string; key: string; value?: string }[] = [];
  if (catFilter) {
    const catName = categorias.find((c) => c.slug === catFilter)?.nombre || catFilter;
    activeFilters.push({ label: catName, key: "categoria" });
  }
  if (search) activeFilters.push({ label: `"${search}"`, key: "search" });
  if (precioMin) activeFilters.push({ label: `Min $${precioMin}`, key: "precio_min" });
  if (precioMax) activeFilters.push({ label: `Max $${precioMax}`, key: "precio_max" });
  if (enStock) activeFilters.push({ label: "En stock", key: "en_stock" });
  if (conDescuento) activeFilters.push({ label: "Con descuento", key: "con_descuento" });
  if (nuevos) activeFilters.push({ label: "Nuevos", key: "nuevos" });

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set("page", "1");
    router.push(`/productos?${params}`);
  };

  const clearAllFilters = () => {
    router.push("/productos");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Productos" }]} />

      {/* Module Hero */}
      <ModuleHero
        title={catFilter ? categorias.find((c) => c.slug === catFilter)?.nombre || "Productos" : "Nuestro Catalogo"}
        subtitle={catFilter ? `Explora todos los productos de esta categoria` : "Encuentra todo lo que necesitas para tu proyecto"}
        icon={<ShoppingBag className="w-6 h-6" />}
        theme="productos"
        compact
      />

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-semibold text-[#8b94a3] uppercase tracking-wider">Filtros:</span>
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => clearFilter(f.key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e8eaee] bg-white text-[#0f1115] text-xs font-medium hover:border-[#0f1115] transition-colors"
            >
              {f.label}
              <X className="size-3" />
            </button>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-[#0e7490] hover:text-[#0f1115] font-semibold"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <FilterPanel
            categorias={categorias}
            activeCat={catFilter}
            sort={sort}
            onCategoryChange={(c) => updateParams("categoria", c)}
            onSortChange={(s) => updateParams("sort", s)}
            precioMin={precioMin}
            precioMax={precioMax}
            onPrecioChange={(min, max) => {
              const p = new URLSearchParams(searchParams.toString());
              if (min) p.set("precio_min", min); else p.delete("precio_min");
              if (max) p.set("precio_max", max); else p.delete("precio_max");
              p.set("page", "1");
              router.push(`/productos?${p}`);
            }}
            enStock={enStock}
            conDescuento={conDescuento}
            nuevos={nuevos}
            onEstadoChange={(key, value) => {
              updateParams(key, value ? "1" : "");
            }}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Search + mobile filter toggle */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5b6472]" />
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
            <div className="md:hidden mb-6 p-4 mc-panel">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-[#0f1115]">Filtros</span>
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
                precioMin={precioMin}
                precioMax={precioMax}
                onPrecioChange={(min, max) => {
                  const p = new URLSearchParams(searchParams.toString());
                  if (min) p.set("precio_min", min); else p.delete("precio_min");
                  if (max) p.set("precio_max", max); else p.delete("precio_max");
                  p.set("page", "1");
                  router.push(`/productos?${p}`);
                }}
                enStock={enStock}
                conDescuento={conDescuento}
                nuevos={nuevos}
                onEstadoChange={(key, value) => {
                  updateParams(key, value ? "1" : "");
                }}
              />
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-[#5b6472] mb-4">
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f1f3f6] flex items-center justify-center">
                <PackageOpen className="size-8 text-[#0f1115]" />
              </div>
              <h3 className="font-bold text-[#0f1115] mb-2">No encontramos productos</h3>
              <p className="text-sm text-[#5b6472] mb-4">
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
              <span className="text-sm text-[#5b6472] px-3">
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
  precioMin,
  precioMax,
  onPrecioChange,
  enStock,
  conDescuento,
  nuevos,
  onEstadoChange,
}: {
  categorias: Categoria[];
  activeCat: string;
  sort: string;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: string) => void;
  precioMin: string;
  precioMax: string;
  onPrecioChange: (min: string, max: string) => void;
  enStock: boolean;
  conDescuento: boolean;
  nuevos: boolean;
  onEstadoChange: (key: "en_stock" | "con_descuento" | "nuevos", value: boolean) => void;
}) {
  const [minLocal, setMinLocal] = useState(precioMin);
  const [maxLocal, setMaxLocal] = useState(precioMax);

  useEffect(() => {
    setMinLocal(precioMin);
    setMaxLocal(precioMax);
  }, [precioMin, precioMax]);

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1115] mb-3">Categorias</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onCategoryChange("")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !activeCat
                  ? "bg-[#0f1115] text-white font-medium"
                  : "text-[#5b6472] hover:bg-[#fafafb]"
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
                    ? "bg-[#0f1115] text-white font-medium"
                    : "text-[#5b6472] hover:bg-[#fafafb]"
                }`}
              >
                {cat.nombre}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1115] mb-3">Precio</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={minLocal}
            onChange={(e) => setMinLocal(e.target.value)}
            className="mc-input mc-price"
          />
          <span className="text-[#8b94a3] text-xs">-</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={maxLocal}
            onChange={(e) => setMaxLocal(e.target.value)}
            className="mc-input mc-price"
          />
        </div>
        <button
          onClick={() => onPrecioChange(minLocal, maxLocal)}
          className="mt-2 w-full px-3 py-2 rounded-lg border border-[#d7dbe2] text-xs font-semibold text-[#0f1115] hover:border-[#0f1115] transition-colors"
        >
          Aplicar rango
        </button>
      </div>

      {/* Estado filters */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1115] mb-3">Estado</h3>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-sm text-[#5b6472] cursor-pointer">
            <input
              type="checkbox"
              checked={enStock}
              onChange={(e) => onEstadoChange("en_stock", e.target.checked)}
              className="mc-checkbox"
            />
            En stock
          </label>
          <label className="flex items-center gap-2.5 text-sm text-[#5b6472] cursor-pointer">
            <input
              type="checkbox"
              checked={conDescuento}
              onChange={(e) => onEstadoChange("con_descuento", e.target.checked)}
              className="mc-checkbox"
            />
            Con descuento
          </label>
          <label className="flex items-center gap-2.5 text-sm text-[#5b6472] cursor-pointer">
            <input
              type="checkbox"
              checked={nuevos}
              onChange={(e) => onEstadoChange("nuevos", e.target.checked)}
              className="mc-checkbox"
            />
            Nuevos (30 dias)
          </label>
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-bold text-[#0f1115] mb-3">Ordenar por</h3>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="mc-select"
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

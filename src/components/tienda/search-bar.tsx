"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { formatCLP } from "@/lib/format";
import type { Producto, Categoria } from "@/lib/types";

interface SearchResult {
  productos: Producto[];
  categorias: Categoria[];
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedInsideDesktop = desktopRef.current?.contains(target);
      const clickedInsideMobile = mobileContainerRef.current?.contains(target);
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus mobile input when opening
  useEffect(() => {
    if (mobileOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileOpen]);

  const performSearch = useCallback(
    async (searchText: string) => {
      if (searchText.trim().length < 2) {
        setResults(null);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/productos?search=${encodeURIComponent(searchText)}&limit=5`),
          fetch(`/api/categorias`),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        const productos: Producto[] = prodData.productos || [];
        const allCats: Categoria[] = Array.isArray(catData) ? catData : [];
        const matchedCats = allCats.filter((c) =>
          c.nombre.toLowerCase().includes(searchText.toLowerCase())
        );

        setResults({ productos, categorias: matchedCats });
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false);
      setMobileOpen(false);
      router.push(`/productos?search=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setMobileOpen(false);
    }
  };

  const handleProductClick = (producto: Producto) => {
    const catSlug = producto.categoria?.slug || "productos";
    setOpen(false);
    setMobileOpen(false);
    setQuery("");
    router.push(`/productos/${catSlug}/${producto.slug}`);
  };

  const handleCategoryClick = (cat: Categoria) => {
    setOpen(false);
    setMobileOpen(false);
    setQuery("");
    router.push(`/productos/${cat.slug}`);
  };

  const handleViewAll = () => {
    setOpen(false);
    setMobileOpen(false);
    router.push(`/productos?search=${encodeURIComponent(query.trim())}`);
  };

  const dropdown = results && open && (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#E2E8F0] z-50 max-h-96 overflow-y-auto">
      {/* Products */}
      {results.productos.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
            Productos
          </p>
          {results.productos.map((prod) => {
            const mainImage = prod.imagenes?.[0];
            const hasOffer =
              prod.precio_oferta !== null && prod.precio_oferta < prod.precio;
            const displayPrice = hasOffer ? prod.precio_oferta! : prod.precio;

            return (
              <button
                key={prod.id}
                onClick={() => handleProductClick(prod)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F0F7FF] transition-colors"
              >
                <div className="w-8 h-8 rounded bg-[#F0F7FF] overflow-hidden shrink-0">
                  {mainImage?.url ? (
                    <img
                      src={mainImage.url}
                      alt={mainImage.alt || prod.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#E2E8F0]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1E293B] font-medium truncate">
                    {prod.nombre}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#1B2A6B] shrink-0">
                  {formatCLP(displayPrice)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Categories */}
      {results.categorias.length > 0 && (
        <div>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[#64748B] uppercase tracking-wider border-t border-[#E2E8F0]">
            Categorias
          </p>
          {results.categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F0F7FF] transition-colors"
            >
              <span className="text-sm text-[#1E293B]">{cat.nombre}</span>
            </button>
          ))}
        </div>
      )}

      {/* View all */}
      {(results.productos.length > 0 || results.categorias.length > 0) && (
        <button
          onClick={handleViewAll}
          className="w-full px-4 py-3 text-sm font-medium text-[#00B4D8] hover:bg-[#F0F7FF] transition-colors border-t border-[#E2E8F0] text-center"
        >
          Ver todos los resultados
        </button>
      )}

      {/* No results */}
      {results.productos.length === 0 && results.categorias.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-[#64748B]">
          No se encontraron resultados para &quot;{query}&quot;
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop search */}
      <div ref={desktopRef} className="relative hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results) setOpen(true);
            }}
            placeholder="Buscar..."
            className="w-40 focus:w-64 transition-all duration-300 pl-10 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#64748B] bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 border-2 border-[#00B4D8] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {dropdown}
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Buscar"
      >
        <Search className="size-5 text-[#1E293B]" />
      </button>

      {/* Mobile search overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex items-center gap-2 p-4 border-b border-[#E2E8F0]">
            <div className="relative flex-1" ref={mobileContainerRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B]" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#64748B] bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
              />
              {dropdown}
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                setOpen(false);
                setQuery("");
              }}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Cerrar busqueda"
            >
              <X className="size-5 text-[#1E293B]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

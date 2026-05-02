"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Package, Search, Plus, Eye, Copy, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";
import type { Producto, Categoria } from "@/lib/types";

function ProductosContent() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (categoriaFilter) params.set("categoria", categoriaFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/productos?${params}`);
    const data = await res.json();
    setProductos(data.productos || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [page, categoriaFilter, search]);

  useEffect(() => {
    fetch("/api/categorias").then((r) => r.json()).then(setCategorias);
  }, []);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const toggleActivo = async (producto: Producto) => {
    try {
      const res = await fetch(`/api/admin/productos/${producto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !producto.activo }),
      });
      if (res.ok) {
        toast.success(producto.activo ? "Producto desactivado" : "Producto activado");
        fetchProductos();
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const duplicar = async (producto: Producto) => {
    try {
      const res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: `${producto.nombre} (copia)`,
          descripcion: producto.descripcion,
          descripcion_corta: producto.descripcion_corta,
          precio: producto.precio,
          precio_oferta: producto.precio_oferta,
          categoria_id: producto.categoria_id,
          imagenes: producto.imagenes,
          variantes: producto.variantes,
          stock: 0,
          stock_minimo: producto.stock_minimo,
          destacado: false,
          activo: false,
          tags: producto.tags,
          peso_gramos: producto.peso_gramos,
          sku: producto.sku ? `${producto.sku}-COPY` : null,
        }),
      });
      if (res.ok) {
        toast.success("Producto duplicado");
        fetchProductos();
      }
    } catch {
      toast.error("Error al duplicar");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Productos</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Gestiona tu catalogo de productos</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button style={{ backgroundColor: "#1B2A6B" }} className="gap-2 text-white hover:opacity-90">
            <Plus className="size-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline">Buscar</Button>
            </form>
            <select
              value={categoriaFilter}
              onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Todas las categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.slug}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Package className="size-5" />
            Lista de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : productos.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
              No hay productos que mostrar.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Producto</th>
                    <th className="hidden pb-3 text-left font-medium md:table-cell">Categoria</th>
                    <th className="pb-3 text-right font-medium">Precio</th>
                    <th className="hidden pb-3 text-center font-medium sm:table-cell">Stock</th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                    <th className="pb-3 text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 shrink-0 rounded-lg bg-cover bg-center"
                            style={{
                              backgroundImage: p.imagenes?.[0]?.url ? `url(${p.imagenes[0].url})` : undefined,
                              backgroundColor: p.imagenes?.[0]?.url ? undefined : "#F1F5F9",
                            }}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium" style={{ color: "#1E293B" }}>{p.nombre}</div>
                            {p.sku && <div className="text-xs" style={{ color: "#64748B" }}>SKU: {p.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 md:table-cell" style={{ color: "#64748B" }}>
                        {p.categoria?.nombre || "—"}
                      </td>
                      <td className="py-3 text-right">
                        <div className="font-medium" style={{ color: "#1E293B" }}>{formatCLP(p.precio)}</div>
                        {p.precio_oferta && (
                          <div className="text-xs" style={{ color: "#F97316" }}>{formatCLP(p.precio_oferta)}</div>
                        )}
                      </td>
                      <td className="hidden py-3 text-center sm:table-cell">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: p.stock === 0 ? "#EF444420" : p.stock <= p.stock_minimo ? "#FFD10020" : "#10B98120",
                            color: p.stock === 0 ? "#EF4444" : p.stock <= p.stock_minimo ? "#B8860B" : "#10B981",
                          }}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: p.activo ? "#10B98120" : "#EF444420",
                            color: p.activo ? "#10B981" : "#EF4444",
                          }}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/admin/productos/${p.id}`}>
                            <Button variant="ghost" size="sm" title="Editar">
                              <Eye className="size-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Duplicar" onClick={() => duplicar(p)}>
                            <Copy className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title={p.activo ? "Desactivar" : "Activar"} onClick={() => toggleActivo(p)}>
                            {p.activo ? <ToggleRight className="size-4 text-green-500" /> : <ToggleLeft className="size-4 text-gray-400" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm" style={{ color: "#64748B" }}>Pagina {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <AuthGuard>
      <ProductosContent />
    </AuthGuard>
  );
}

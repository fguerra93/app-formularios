"use client";

import { useEffect, useState } from "react";
import { Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";
import type { Producto } from "@/lib/types";

type FilterType = "todos" | "bajo" | "agotado";

function InventarioContent() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/productos?limit=1000");
    const data = await res.json();
    setProductos(data.productos || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = productos.filter((p) => {
    if (filter === "bajo") return p.stock > 0 && p.stock <= p.stock_minimo;
    if (filter === "agotado") return p.stock === 0;
    return true;
  });

  const startEditStock = (p: Producto) => {
    setEditingId(p.id);
    setEditStock(p.stock);
  };

  const saveStock = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: editStock }),
      });
      if (res.ok) {
        toast.success("Stock actualizado");
        setEditingId(null);
        fetchData();
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const stockBajo = productos.filter((p) => p.stock > 0 && p.stock <= p.stock_minimo).length;
  const agotados = productos.filter((p) => p.stock === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Inventario</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>Control de stock de productos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter("todos")}>
          <CardContent className="pt-6">
            <p className="text-sm" style={{ color: "#64748B" }}>Total productos</p>
            <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>{productos.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter("bajo")}>
          <CardContent className="pt-6">
            <p className="text-sm" style={{ color: "#B8860B" }}>Stock bajo</p>
            <p className="text-2xl font-bold" style={{ color: "#B8860B" }}>{stockBajo}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilter("agotado")}>
          <CardContent className="pt-6">
            <p className="text-sm" style={{ color: "#EF4444" }}>Agotados</p>
            <p className="text-2xl font-bold" style={{ color: "#EF4444" }}>{agotados}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2">
        {(["todos", "bajo", "agotado"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === f ? "#1B2A6B" : "#F1F5F9",
              color: filter === f ? "#FFFFFF" : "#64748B",
            }}
          >
            {f === "todos" ? "Todos" : f === "bajo" ? "Stock Bajo" : "Agotados"}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Warehouse className="size-5" />
            Control de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>No hay productos en esta vista.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Producto</th>
                    <th className="hidden pb-3 text-left font-medium sm:table-cell">SKU</th>
                    <th className="pb-3 text-center font-medium">Stock Actual</th>
                    <th className="hidden pb-3 text-center font-medium sm:table-cell">Stock Min.</th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const estado = p.stock === 0 ? "Agotado" : p.stock <= p.stock_minimo ? "Bajo" : "OK";
                    const estadoStyle = {
                      Agotado: { bg: "#EF444420", text: "#EF4444" },
                      Bajo: { bg: "#FFD10020", text: "#B8860B" },
                      OK: { bg: "#10B98120", text: "#10B981" },
                    }[estado];

                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium" style={{ color: "#1E293B" }}>{p.nombre}</div>
                        </td>
                        <td className="hidden py-3 sm:table-cell" style={{ color: "#64748B" }}>
                          {p.sku || "—"}
                        </td>
                        <td className="py-3 text-center">
                          {editingId === p.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                className="w-20 text-center"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveStock(p.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <button onClick={() => saveStock(p.id)} className="text-green-500 text-xs font-medium">OK</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditStock(p)}
                              className="cursor-pointer rounded px-2 py-1 font-medium hover:bg-gray-100"
                              style={{ color: "#1E293B" }}
                            >
                              {p.stock}
                            </button>
                          )}
                        </td>
                        <td className="hidden py-3 text-center sm:table-cell" style={{ color: "#64748B" }}>
                          {p.stock_minimo}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: estadoStyle.bg, color: estadoStyle.text }}
                          >
                            {estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventarioPage() {
  return (
    <AuthGuard>
      <InventarioContent />
    </AuthGuard>
  );
}

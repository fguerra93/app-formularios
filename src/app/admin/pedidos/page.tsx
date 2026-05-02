"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import type { Pedido } from "@/lib/types";

const estadoColors: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "#94A3B820", text: "#64748B" },
  confirmado: { bg: "#00B4D820", text: "#00B4D8" },
  preparando: { bg: "#FFD10020", text: "#B8860B" },
  enviado: { bg: "#8B5CF620", text: "#7C3AED" },
  entregado: { bg: "#10B98120", text: "#10B981" },
  cancelado: { bg: "#EF444420", text: "#EF4444" },
};

const pagoColors: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "#FFD10020", text: "#B8860B" },
  pagado: { bg: "#10B98120", text: "#10B981" },
  fallido: { bg: "#EF444420", text: "#EF4444" },
  reembolsado: { bg: "#8B5CF620", text: "#7C3AED" },
};

function PedidosContent() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState("todos");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (estado !== "todos") params.set("estado", estado);
    if (search) params.set("search", search);
    if (desde) params.set("desde", new Date(desde).toISOString());
    if (hasta) params.set("hasta", new Date(hasta + "T23:59:59").toISOString());

    const res = await fetch(`/api/admin/pedidos?${params}`);
    const data = await res.json();
    setPedidos(data.data || []);
    setTotalPages(data.totalPages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, estado, search, desde, hasta]);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (estado !== "todos") params.set("estado", estado);
    window.open(`/api/admin/pedidos/export?${params}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Pedidos</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>{total} pedidos en total</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="outline">Buscar</Button>
            </form>
            <select
              value={estado}
              onChange={(e) => { setEstado(e.target.value); setPage(1); }}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="preparando">Preparando</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap" style={{ color: "#64748B" }}>Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => { setDesde(e.target.value); setPage(1); }}
                className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs whitespace-nowrap" style={{ color: "#64748B" }}>Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => { setHasta(e.target.value); setPage(1); }}
                className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            {(desde || hasta) && (
              <button
                onClick={() => { setDesde(""); setHasta(""); setPage(1); }}
                className="text-xs underline"
                style={{ color: "#64748B" }}
              >
                Limpiar fechas
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <ShoppingBag className="size-5" />
            Lista de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : pedidos.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
              No hay pedidos que coincidan con los filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">#Pedido</th>
                    <th className="pb-3 text-left font-medium">Fecha</th>
                    <th className="pb-3 text-left font-medium">Cliente</th>
                    <th className="hidden pb-3 text-center font-medium md:table-cell">Items</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                    <th className="hidden pb-3 text-center font-medium sm:table-cell">Pago</th>
                    <th className="pb-3 text-center font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => {
                    const ec = estadoColors[p.estado] || estadoColors.pendiente;
                    const pc = pagoColors[p.pago_estado] || pagoColors.pendiente;
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium" style={{ color: "#1B2A6B" }}>
                          #{p.numero_pedido}
                        </td>
                        <td className="py-3" style={{ color: "#64748B" }}>
                          {new Date(p.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}
                        </td>
                        <td className="py-3">
                          <div className="font-medium" style={{ color: "#1E293B" }}>{p.cliente_nombre}</div>
                          <div className="text-xs" style={{ color: "#64748B" }}>{p.cliente_email}</div>
                        </td>
                        <td className="hidden py-3 text-center md:table-cell" style={{ color: "#64748B" }}>
                          {p.items.length}
                        </td>
                        <td className="py-3 text-right font-medium" style={{ color: "#1E293B" }}>
                          {formatCLP(p.total)}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: ec.bg, color: ec.text }}
                          >
                            {p.estado}
                          </span>
                        </td>
                        <td className="hidden py-3 text-center sm:table-cell">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: pc.bg, color: pc.text }}
                          >
                            {p.pago_estado}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Link href={`/admin/pedidos/${p.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="size-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-sm" style={{ color: "#64748B" }}>
                Pagina {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
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

export default function PedidosPage() {
  return (
    <AuthGuard>
      <PedidosContent />
    </AuthGuard>
  );
}

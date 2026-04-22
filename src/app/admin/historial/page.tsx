"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import type { Formulario } from "@/lib/types";

const ITEMS_PER_PAGE = 10;

const estadoStyles: Record<string, { bg: string; color: string }> = {
  nuevo: { bg: "#00B4D820", color: "#00B4D8" },
  revisado: { bg: "#FFD10020", color: "#B8960A" },
  completado: { bg: "#10B98120", color: "#10B981" },
};

function HistorialContent() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
      });
      if (search) params.set("search", search);
      if (estadoFilter !== "todos") params.set("estado", estadoFilter);

      const res = await fetch(`/api/formularios?${params}`);
      const json = await res.json();
      setFormularios(json.data || json || []);
      setTotalPages(json.totalPages || Math.ceil((json.total || 0) / ITEMS_PER_PAGE) || 1);
    } catch (err) {
      console.error("Error fetching formularios:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, estadoFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, estadoFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          Historial
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Todos los formularios recibidos
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
                style={{ color: "#64748B" }}
              />
              <Input
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={estadoFilter}
              onValueChange={(val) => setEstadoFilter(val as string)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="revisado">Revisado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : formularios.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: "#64748B" }}>
                No se encontraron formularios.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Material</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formularios.map((f) => {
                  const estilo = estadoStyles[f.estado] || { bg: "#64748B20", color: "#64748B" };
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs" style={{ color: "#64748B" }}>
                        {new Date(f.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-medium" style={{ color: "#1E293B" }}>
                        {f.nombre}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" style={{ color: "#64748B" }}>
                        {f.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell" style={{ color: "#64748B" }}>
                        {f.material || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                          style={{ backgroundColor: estilo.bg, color: estilo.color }}
                        >
                          {f.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/formularios/${f.id}`}>
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="size-4" style={{ color: "#1B2A6B" }} />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "#64748B" }}>
            Pagina {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistorialPage() {
  return (
    <AuthGuard>
      <HistorialContent />
    </AuthGuard>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Megaphone,
  Mail,
  BarChart3,
  Eye,
  Pencil,
  Trash2,
  Plus,
  LayoutTemplate,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

interface Campana {
  id: string;
  nombre: string;
  asunto: string;
  estado: string;
  total_destinatarios: number;
  total_enviados: number;
  total_abiertos: number;
  total_clicks: number;
  total_errores: number;
  programada_para: string | null;
  enviada_at: string | null;
  created_at: string;
}

type FilterTab = "todas" | "borrador" | "programada" | "enviada";

const estadoColors: Record<string, { bg: string; text: string; label: string }> = {
  borrador: { bg: "bg-gray-100", text: "text-gray-600", label: "Borrador" },
  programada: { bg: "bg-blue-100", text: "text-blue-700", label: "Programada" },
  enviando: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Enviando" },
  enviada: { bg: "bg-green-100", text: "text-green-700", label: "Enviada" },
  cancelada: { bg: "bg-red-100", text: "text-red-700", label: "Cancelada" },
};

function CampanasContent() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");

  const fetchCampanas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "todas") params.set("estado", activeTab);
      const res = await fetch(`/api/admin/campanas?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setCampanas(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar campanas");
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchCampanas();
  }, [fetchCampanas]);

  const handleDelete = async (campana: Campana) => {
    if (!confirm(`Eliminar la campana "${campana.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/campanas/${campana.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Campana eliminada");
        fetchCampanas();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  // Compute stats
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const campanasEsteMes = campanas.filter(
    (c) => c.estado === "enviada" && c.enviada_at && new Date(c.enviada_at) >= firstOfMonth
  );
  const totalEnviadosMes = campanasEsteMes.reduce((sum, c) => sum + c.total_enviados, 0);
  const tasaApertura =
    totalEnviadosMes > 0
      ? Math.round(
          (campanasEsteMes.reduce((sum, c) => sum + c.total_abiertos, 0) / totalEnviadosMes) * 100
        )
      : 0;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "borrador", label: "Borrador" },
    { key: "programada", label: "Programadas" },
    { key: "enviada", label: "Enviadas" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
            Campanas de Marketing
          </h1>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Gestiona tus campanas de email marketing
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/campanas/templates">
            <Button variant="outline" className="gap-2">
              <LayoutTemplate className="size-4" />
              Templates
            </Button>
          </Link>
          <Link href="/admin/campanas/nueva">
            <Button
              style={{ backgroundColor: "#1B2A6B" }}
              className="gap-2 text-white hover:opacity-90"
            >
              <Plus className="size-4" />
              Nueva Campana
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className="flex size-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#1B2A6B10" }}
            >
              <Megaphone className="size-6" style={{ color: "#1B2A6B" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Campanas enviadas (mes)
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                  {campanasEsteMes.length}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className="flex size-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#00B4D810" }}
            >
              <Mail className="size-6" style={{ color: "#00B4D8" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Emails enviados
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                  {totalEnviadosMes.toLocaleString("es-CL")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className="flex size-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#FF971010" }}
            >
              <BarChart3 className="size-6" style={{ color: "#FF9710" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Tasa apertura promedio
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                  {tasaApertura}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            style={
              activeTab === tab.key
                ? { backgroundColor: "#1B2A6B", color: "#FFFFFF" }
                : undefined
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Megaphone className="size-5" />
            Campanas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : campanas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Megaphone className="size-12" style={{ color: "#CBD5E1" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>
                No hay campanas{activeTab !== "todas" ? ` con estado "${activeTab}"` : ""}.
              </p>
              <Link href="/admin/campanas/nueva">
                <Button
                  size="sm"
                  style={{ backgroundColor: "#1B2A6B" }}
                  className="gap-2 text-white hover:opacity-90"
                >
                  <Plus className="size-4" />
                  Crear primera campana
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Nombre</th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                    <th className="hidden pb-3 text-right font-medium sm:table-cell">
                      Destinatarios
                    </th>
                    <th className="hidden pb-3 text-right font-medium md:table-cell">
                      Enviados
                    </th>
                    <th className="hidden pb-3 text-right font-medium md:table-cell">
                      Abiertos
                    </th>
                    <th className="hidden pb-3 text-left font-medium lg:table-cell">
                      Fecha
                    </th>
                    <th className="pb-3 text-center font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campanas.map((c) => {
                    const estado = estadoColors[c.estado] || estadoColors.borrador;
                    const tasaAb =
                      c.total_enviados > 0
                        ? Math.round((c.total_abiertos / c.total_enviados) * 100)
                        : 0;
                    return (
                      <tr
                        key={c.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3" style={{ color: "#1E293B" }}>
                          <Link
                            href={`/admin/campanas/${c.id}`}
                            className="font-medium hover:underline"
                            style={{ color: "#1B2A6B" }}
                          >
                            {c.nombre}
                          </Link>
                          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                            {c.asunto}
                          </p>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${estado.bg} ${estado.text}`}
                          >
                            {estado.label}
                          </span>
                        </td>
                        <td
                          className="hidden py-3 text-right sm:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {c.total_destinatarios.toLocaleString("es-CL")}
                        </td>
                        <td
                          className="hidden py-3 text-right md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {c.total_enviados.toLocaleString("es-CL")}
                        </td>
                        <td
                          className="hidden py-3 text-right md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {tasaAb}%
                        </td>
                        <td
                          className="hidden py-3 lg:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {c.enviada_at
                            ? new Date(c.enviada_at).toLocaleDateString("es-CL", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : c.created_at
                              ? new Date(c.created_at).toLocaleDateString("es-CL", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "---"}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/admin/campanas/${c.id}`}>
                              <Button variant="ghost" size="sm" title="Ver">
                                <Eye className="size-4" />
                              </Button>
                            </Link>
                            {c.estado === "borrador" && (
                              <Link href={`/admin/campanas/nueva?edit=${c.id}`}>
                                <Button variant="ghost" size="sm" title="Editar">
                                  <Pencil className="size-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Eliminar"
                              onClick={() => handleDelete(c)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
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

export default function CampanasPage() {
  return (
    <AuthGuard>
      <CampanasContent />
    </AuthGuard>
  );
}

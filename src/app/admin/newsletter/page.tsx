"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Mail, Send, Search, Users, UserPlus, UserX, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

interface Suscriptor {
  id: string;
  email: string;
  nombre: string | null;
  fuente: string | null;
  activo: boolean;
  created_at: string;
}

type TabKey = "suscriptores" | "enviar";

function NewsletterContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("suscriptores");
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Enviar state
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchSuscriptores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/newsletter?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setSuscriptores(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar suscriptores");
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    fetchSuscriptores();
  }, [fetchSuscriptores]);

  // Compute stats from suscriptores data
  const stats = useMemo(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalActivos = suscriptores.filter((s) => s.activo).length;
    const totalInactivos = suscriptores.filter((s) => !s.activo).length;
    const nuevosEsteMes = suscriptores.filter(
      (s) => new Date(s.created_at) >= firstOfMonth
    ).length;
    return { totalActivos, totalInactivos, nuevosEsteMes };
  }, [suscriptores]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuscriptores();
  };

  const handleSendNewsletter = async () => {
    if (!asunto.trim()) {
      toast.error("El asunto es obligatorio");
      return;
    }
    if (!contenido.trim()) {
      toast.error("El contenido es obligatorio");
      return;
    }
    if (
      !confirm(
        `Enviar newsletter a ${stats.totalActivos} suscriptores activos?`
      )
    )
      return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/enviar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asunto: asunto.trim(), contenido }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          `Newsletter enviado a ${data.enviados} suscriptores${
            data.errores > 0 ? ` (${data.errores} errores)` : ""
          }`
        );
        setAsunto("");
        setContenido("");
        setShowPreview(false);
      } else {
        toast.error(data.error || "Error al enviar newsletter");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSending(false);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "suscriptores", label: "Suscriptores" },
    { key: "enviar", label: "Enviar Newsletter" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          Newsletter
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Gestiona suscriptores y envia comunicaciones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className="flex size-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#1B2A6B10" }}
            >
              <Users className="size-6" style={{ color: "#1B2A6B" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Suscriptores Activos
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p
                  className="text-2xl font-bold"
                  style={{ color: "#1E293B" }}
                >
                  {stats.totalActivos}
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
              <UserPlus className="size-6" style={{ color: "#00B4D8" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Nuevos este mes
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p
                  className="text-2xl font-bold"
                  style={{ color: "#1E293B" }}
                >
                  {stats.nuevosEsteMes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className="flex size-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#EF444410" }}
            >
              <UserX className="size-6" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#64748B" }}>
                Inactivos
              </p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-16" />
              ) : (
                <p
                  className="text-2xl font-bold"
                  style={{ color: "#1E293B" }}
                >
                  {stats.totalInactivos}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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

      {/* ─── Suscriptores Tab ─── */}
      {activeTab === "suscriptores" && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle
                className="flex items-center gap-2"
                style={{ color: "#1E293B" }}
              >
                <Mail className="size-5" />
                Lista de Suscriptores
              </CardTitle>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: "#94A3B8" }}
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por email..."
                    className="pl-9"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                >
                  Buscar
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : suscriptores.length === 0 ? (
              <p
                className="py-8 text-center text-sm"
                style={{ color: "#64748B" }}
              >
                No hay suscriptores.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ color: "#64748B" }}>
                      <th className="pb-3 text-left font-medium">Email</th>
                      <th className="hidden pb-3 text-left font-medium sm:table-cell">
                        Nombre
                      </th>
                      <th className="hidden pb-3 text-center font-medium md:table-cell">
                        Fuente
                      </th>
                      <th className="hidden pb-3 text-left font-medium md:table-cell">
                        Fecha
                      </th>
                      <th className="pb-3 text-center font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suscriptores.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td
                          className="py-3 font-medium"
                          style={{ color: "#1E293B" }}
                        >
                          {s.email}
                        </td>
                        <td
                          className="hidden py-3 sm:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {s.nombre || "—"}
                        </td>
                        <td className="hidden py-3 text-center md:table-cell">
                          {s.fuente ? (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {s.fuente}
                            </span>
                          ) : (
                            <span style={{ color: "#64748B" }}>—</span>
                          )}
                        </td>
                        <td
                          className="hidden py-3 md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {new Date(s.created_at).toLocaleDateString(
                            "es-CL",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              s.activo
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {s.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Enviar Newsletter Tab ─── */}
      {activeTab === "enviar" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle
                className="flex items-center gap-2"
                style={{ color: "#1E293B" }}
              >
                <Send className="size-5" />
                Componer Newsletter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-semibold"
                    style={{ color: "#1E293B" }}
                  >
                    Asunto
                  </label>
                  <Input
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Asunto del newsletter"
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-semibold"
                    style={{ color: "#1E293B" }}
                  >
                    Contenido (HTML)
                  </label>
                  <textarea
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    placeholder="<h1>Titulo</h1><p>Contenido del newsletter...</p>"
                    rows={12}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Ocultar preview" : "Ver preview"}
                  </Button>
                  <Button
                    onClick={handleSendNewsletter}
                    disabled={sending || stats.totalActivos === 0}
                    style={{ backgroundColor: "#1B2A6B" }}
                    className="gap-2 text-white hover:opacity-90"
                  >
                    <Send className="size-4" />
                    {sending
                      ? "Enviando..."
                      : `Enviar a ${stats.totalActivos} suscriptores`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="flex items-center gap-2"
                    style={{ color: "#1E293B" }}
                  >
                    <Mail className="size-5" />
                    Vista Previa
                  </CardTitle>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="rounded-lg p-1 hover:bg-gray-100"
                  >
                    <X className="size-5" style={{ color: "#64748B" }} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {asunto && (
                  <div className="mb-3 border-b pb-3">
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#94A3B8" }}
                    >
                      Asunto
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#1E293B" }}
                    >
                      {asunto}
                    </p>
                  </div>
                )}
                <div
                  className="prose prose-sm max-w-none rounded-lg border border-gray-200 p-4"
                  dangerouslySetInnerHTML={{
                    __html: contenido || "<p style='color:#94A3B8'>El contenido aparecera aqui...</p>",
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewsletterPage() {
  return (
    <AuthGuard>
      <NewsletterContent />
    </AuthGuard>
  );
}

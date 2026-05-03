"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Megaphone,
  Mail,
  MousePointerClick,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
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
  template_id: string | null;
  contenido_html: string | null;
  segmento: Record<string, unknown> | null;
  total_destinatarios: number;
  total_enviados: number;
  total_abiertos: number;
  total_clicks: number;
  total_errores: number;
  programada_para: string | null;
  enviada_at: string | null;
  created_at: string;
}

interface Envio {
  id: string;
  email: string;
  nombre: string | null;
  estado: string;
  abierto_at: string | null;
  click_at: string | null;
  error_msg: string | null;
  created_at: string;
}

const estadoColors: Record<string, { bg: string; text: string; label: string }> = {
  borrador: { bg: "bg-gray-100", text: "text-gray-600", label: "Borrador" },
  programada: { bg: "bg-blue-100", text: "text-blue-700", label: "Programada" },
  enviando: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Enviando" },
  enviada: { bg: "bg-green-100", text: "text-green-700", label: "Enviada" },
  cancelada: { bg: "bg-red-100", text: "text-red-700", label: "Cancelada" },
};

const envioEstadoColors: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: "bg-gray-100", text: "text-gray-600", label: "Pendiente" },
  enviado: { bg: "bg-blue-100", text: "text-blue-700", label: "Enviado" },
  abierto: { bg: "bg-green-100", text: "text-green-700", label: "Abierto" },
  click: { bg: "bg-purple-100", text: "text-purple-700", label: "Click" },
  rebotado: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Rebotado" },
  error: { bg: "bg-red-100", text: "text-red-700", label: "Error" },
};

function CampanaDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campana, setCampana] = useState<Campana | null>(null);
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnvios, setLoadingEnvios] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/campanas/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCampana(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Error al cargar campana");
        setLoading(false);
      });

    fetch(`/api/admin/campanas/${id}/stats`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setEnvios(Array.isArray(data) ? data : data.envios || data.data || []);
        setLoadingEnvios(false);
      })
      .catch(() => setLoadingEnvios(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (!campana) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Megaphone className="size-12" style={{ color: "#CBD5E1" }} />
        <p style={{ color: "#64748B" }}>Campana no encontrada.</p>
        <Link href="/admin/campanas">
          <Button variant="outline">Volver a campanas</Button>
        </Link>
      </div>
    );
  }

  const estado = estadoColors[campana.estado] || estadoColors.borrador;
  const tasaApertura =
    campana.total_enviados > 0
      ? Math.round((campana.total_abiertos / campana.total_enviados) * 100)
      : 0;
  const tasaClicks =
    campana.total_enviados > 0
      ? Math.round((campana.total_clicks / campana.total_enviados) * 100)
      : 0;
  const tasaErrores =
    campana.total_destinatarios > 0
      ? Math.round((campana.total_errores / campana.total_destinatarios) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/campanas">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                {campana.nombre}
              </h1>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.bg} ${estado.text}`}
              >
                {estado.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Asunto: {campana.asunto}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
          {campana.enviada_at ? (
            <>
              <CheckCircle2 className="size-4" style={{ color: "#10B981" }} />
              Enviada el{" "}
              {new Date(campana.enviada_at).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          ) : (
            <>
              <Clock className="size-4" />
              Creada el{" "}
              {new Date(campana.created_at).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Enviados */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#1B2A6B10" }}
              >
                <Send className="size-5" style={{ color: "#1B2A6B" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Enviados
                </p>
                <p className="text-xl font-bold" style={{ color: "#1E293B" }}>
                  {campana.total_enviados.toLocaleString("es-CL")}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${campana.total_destinatarios > 0 ? Math.round((campana.total_enviados / campana.total_destinatarios) * 100) : 0}%`,
                    backgroundColor: "#1B2A6B",
                  }}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                {campana.total_enviados} de {campana.total_destinatarios} destinatarios
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Abiertos */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#00B4D810" }}
              >
                <Mail className="size-5" style={{ color: "#00B4D8" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Abiertos
                </p>
                <p className="text-xl font-bold" style={{ color: "#1E293B" }}>
                  {tasaApertura}%
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tasaApertura}%`,
                    backgroundColor: "#00B4D8",
                  }}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                {campana.total_abiertos.toLocaleString("es-CL")} abiertos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Clicks */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#FF971010" }}
              >
                <MousePointerClick className="size-5" style={{ color: "#FF9710" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Clicks
                </p>
                <p className="text-xl font-bold" style={{ color: "#1E293B" }}>
                  {tasaClicks}%
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tasaClicks}%`,
                    backgroundColor: "#FF9710",
                  }}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                {campana.total_clicks.toLocaleString("es-CL")} clicks
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Errores */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#EF444410" }}
              >
                <AlertTriangle className="size-5" style={{ color: "#EF4444" }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Errores
                </p>
                <p className="text-xl font-bold" style={{ color: "#1E293B" }}>
                  {campana.total_errores}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full" style={{ backgroundColor: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${tasaErrores}%`,
                    backgroundColor: "#EF4444",
                  }}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
                {tasaErrores}% tasa de error
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <Mail className="size-5" />
            Destinatarios ({envios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEnvios ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : envios.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
              No hay datos de envios para esta campana.
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
                    <th className="pb-3 text-center font-medium">Estado</th>
                    <th className="hidden pb-3 text-left font-medium md:table-cell">
                      Abierto
                    </th>
                    <th className="hidden pb-3 text-left font-medium lg:table-cell">
                      Click
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {envios.map((e) => {
                    const eEstado = envioEstadoColors[e.estado] || envioEstadoColors.pendiente;
                    return (
                      <tr
                        key={e.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3 font-medium" style={{ color: "#1E293B" }}>
                          {e.email}
                        </td>
                        <td
                          className="hidden py-3 sm:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {e.nombre || "---"}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${eEstado.bg} ${eEstado.text}`}
                          >
                            {eEstado.label}
                          </span>
                        </td>
                        <td
                          className="hidden py-3 md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {e.abierto_at
                            ? new Date(e.abierto_at).toLocaleString("es-CL", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "---"}
                        </td>
                        <td
                          className="hidden py-3 lg:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {e.click_at
                            ? new Date(e.click_at).toLocaleString("es-CL", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "---"}
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

      {/* Email Preview */}
      {campana.contenido_html && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
              <Megaphone className="size-5" />
              Vista previa del email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto rounded-lg border bg-white" style={{ maxWidth: 600 }}>
              <iframe
                srcDoc={campana.contenido_html}
                className="h-[500px] w-full rounded-lg"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CampanaDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <CampanaDetailContent params={props.params} />
    </AuthGuard>
  );
}

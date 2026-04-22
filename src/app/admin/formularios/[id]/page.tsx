"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Clock,
  User,
  Mail,
  Phone,
  Package,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import type { Formulario } from "@/lib/types";

const estadoStyles: Record<string, { bg: string; color: string }> = {
  nuevo: { bg: "#00B4D820", color: "#00B4D8" },
  revisado: { bg: "#FFD10020", color: "#B8960A" },
  completado: { bg: "#10B98120", color: "#10B981" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/formularios/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormulario(data);
        }
      } catch (err) {
        console.error("Error loading formulario:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleEstadoChange = async (newEstado: string | null) => {
    if (!newEstado) return;
    if (!formulario) return;
    setUpdatingEstado(true);
    try {
      const res = await fetch(`/api/formularios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (res.ok) {
        setFormulario({ ...formulario, estado: newEstado as Formulario["estado"] });
        toast.success("Estado actualizado correctamente");
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setUpdatingEstado(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-lg font-medium" style={{ color: "#1E293B" }}>
          Formulario no encontrado
        </p>
        <Link href="/admin/historial">
          <Button variant="outline">
            <ArrowLeft className="size-4" />
            Volver al historial
          </Button>
        </Link>
      </div>
    );
  }

  const estilo = estadoStyles[formulario.estado] || { bg: "#64748B20", color: "#64748B" };

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/admin/historial">
          <Button variant="ghost" className="gap-2" style={{ color: "#64748B" }}>
            <ArrowLeft className="size-4" />
            Volver al historial
          </Button>
        </Link>
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize"
          style={{ backgroundColor: estilo.bg, color: estilo.color }}
        >
          {formulario.estado}
        </span>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg" style={{ color: "#1E293B" }}>
            Detalles del formulario
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "#64748B" }}>
              Estado:
            </span>
            <Select
              value={formulario.estado}
              onValueChange={handleEstadoChange}
              disabled={updatingEstado}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="revisado">Revisado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="Nombre" value={formulario.nombre} />
            <InfoRow icon={Mail} label="Email" value={formulario.email} />
            <InfoRow icon={Phone} label="Telefono" value={formulario.telefono || "No proporcionado"} />
            <InfoRow icon={Package} label="Material" value={formulario.material || "No especificado"} />
          </div>

          {formulario.mensaje && (
            <>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <MessageSquare className="mt-0.5 size-4 shrink-0" style={{ color: "#64748B" }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: "#64748B" }}>
                    Mensaje
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap" style={{ color: "#1E293B" }}>
                    {formulario.mensaje}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator className="my-4" />

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              icon={Clock}
              label="Creado"
              value={new Date(formulario.created_at).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            <InfoRow
              icon={Clock}
              label="Actualizado"
              value={new Date(formulario.updated_at).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Files Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#1E293B" }}>
            <FileText className="size-5" />
            Archivos adjuntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formulario.archivos && formulario.archivos.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {formulario.archivos.map((archivo, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex size-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "#1B2A6B15" }}
                    >
                      <FileText className="size-4" style={{ color: "#1B2A6B" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: "#1E293B" }}>
                        {archivo.nombre}
                      </p>
                      <p className="text-xs" style={{ color: "#64748B" }}>
                        {formatBytes(archivo.tamaño)} · {archivo.tipo}
                      </p>
                    </div>
                  </div>
                  <a
                    href={archivo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button variant="ghost" size="icon-sm">
                      <Download className="size-4" style={{ color: "#1B2A6B" }} />
                    </Button>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-center text-sm" style={{ color: "#64748B" }}>
              Sin archivos adjuntos
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nextcloud Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#1E293B" }}>
            <ExternalLink className="size-5" />
            Nextcloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formulario.nextcloud_synced && formulario.nextcloud_path ? (
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "#10B98120", color: "#10B981" }}
              >
                Sincronizado
              </span>
              <a
                href={formulario.nextcloud_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
                style={{ color: "#1B2A6B" }}
              >
                Abrir en Nextcloud
              </a>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#64748B" }}>
              No sincronizado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0" style={{ color: "#64748B" }} />
      <div>
        <p className="text-xs font-medium" style={{ color: "#64748B" }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: "#1E293B" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function FormularioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AuthGuard>
      <DetailContent params={params} />
    </AuthGuard>
  );
}

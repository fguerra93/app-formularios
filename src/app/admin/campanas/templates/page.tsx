"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutTemplate,
  Plus,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

interface Template {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  thumbnail_url: string | null;
  es_preset: boolean;
  activo: boolean;
  created_at: string;
}

const PRESET_TEMPLATES: Template[] = [
  {
    id: "preset-bienvenida",
    nombre: "Bienvenida",
    descripcion: "Email de bienvenida para nuevos suscriptores",
    categoria: "onboarding",
    thumbnail_url: null,
    es_preset: true,
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-promocion",
    nombre: "Promocion General",
    descripcion: "Template para promociones y ofertas especiales",
    categoria: "promocion",
    thumbnail_url: null,
    es_preset: true,
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-newsletter",
    nombre: "Newsletter Mensual",
    descripcion: "Boletin mensual con novedades y contenido",
    categoria: "newsletter",
    thumbnail_url: null,
    es_preset: true,
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-producto",
    nombre: "Lanzamiento de Producto",
    descripcion: "Anuncio de un nuevo producto o servicio",
    categoria: "producto",
    thumbnail_url: null,
    es_preset: true,
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "preset-evento",
    nombre: "Evento / Invitacion",
    descripcion: "Invitacion a eventos, ferias o webinars",
    categoria: "evento",
    thumbnail_url: null,
    es_preset: true,
    activo: true,
    created_at: new Date().toISOString(),
  },
];

const categoriaBg: Record<string, string> = {
  onboarding: "#1B2A6B",
  promocion: "#FF9710",
  newsletter: "#00B4D8",
  producto: "#10B981",
  evento: "#8B5CF6",
  general: "#64748B",
};

function TemplatesContent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campanas/templates", {
        credentials: "include",
      });
      const data = await res.json();
      const fromApi = Array.isArray(data) ? data : data.data || [];
      // If API returns empty, show preset templates as seed data
      setTemplates(fromApi.length > 0 ? fromApi : PRESET_TEMPLATES);
    } catch {
      setTemplates(PRESET_TEMPLATES);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDuplicate = async (template: Template) => {
    try {
      const res = await fetch("/api/admin/campanas/templates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: `${template.nombre} (copia)`,
          descripcion: template.descripcion,
          categoria: template.categoria,
          contenido_json: [],
          es_preset: false,
        }),
      });
      if (res.ok) {
        toast.success("Template duplicado");
        fetchTemplates();
      } else {
        toast.error("Error al duplicar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleDelete = async (template: Template) => {
    if (template.es_preset && template.id.startsWith("preset-")) {
      toast.error("No se pueden eliminar templates preestablecidos");
      return;
    }
    if (!confirm(`Eliminar el template "${template.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/campanas/templates/${template.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Template eliminado");
        fetchTemplates();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

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
            <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
              Templates de Email
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>
              Gestiona tus plantillas de email reutilizables
            </p>
          </div>
        </div>
        <Link href="/admin/campanas/editor/nuevo">
          <Button
            style={{ backgroundColor: "#1B2A6B" }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            Nuevo Template
          </Button>
        </Link>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <LayoutTemplate className="size-16" style={{ color: "#CBD5E1" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>
            No hay templates creados.
          </p>
          <Link href="/admin/campanas/editor/nuevo">
            <Button
              style={{ backgroundColor: "#1B2A6B" }}
              className="gap-2 text-white hover:opacity-90"
            >
              <Plus className="size-4" />
              Crear primer template
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const catColor = categoriaBg[t.categoria] || categoriaBg.general;
            return (
              <Card key={t.id} className="group overflow-hidden">
                {/* Thumbnail / Colored header */}
                <div
                  className="relative flex h-40 items-center justify-center"
                  style={{
                    backgroundColor: t.thumbnail_url ? undefined : `${catColor}12`,
                  }}
                >
                  {t.thumbnail_url ? (
                    <img
                      src={t.thumbnail_url}
                      alt={t.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <LayoutTemplate className="size-12" style={{ color: catColor }} />
                      <span className="text-xs font-medium" style={{ color: catColor }}>
                        {t.nombre}
                      </span>
                    </div>
                  )}

                  {/* Hover actions overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                    <Link href={`/admin/campanas/editor/${t.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 bg-white text-sm hover:bg-gray-100"
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1E293B" }}>
                        {t.nombre}
                      </p>
                      {t.descripcion && (
                        <p className="mt-0.5 text-xs" style={{ color: "#64748B" }}>
                          {t.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: catColor }}
                    >
                      {t.categoria}
                    </span>
                    {t.es_preset && (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Preset
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/admin/campanas/editor/${t.id}`}>
                      <Button variant="ghost" size="sm" title="Editar" className="gap-1">
                        <Pencil className="size-3.5" />
                        <span className="text-xs">Editar</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Duplicar"
                      className="gap-1"
                      onClick={() => handleDuplicate(t)}
                    >
                      <Copy className="size-3.5" />
                      <span className="text-xs">Duplicar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Eliminar"
                      className="gap-1 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(t)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="text-xs">Eliminar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <AuthGuard>
      <TemplatesContent />
    </AuthGuard>
  );
}

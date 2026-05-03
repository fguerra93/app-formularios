"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

interface Pregunta {
  id: string;
  producto_id: string;
  productos?: { nombre: string } | null;
  pregunta: string;
  autor_nombre: string;
  autor_email?: string;
  respuesta: string | null;
  respuesta_at: string | null;
  publica: boolean;
  created_at: string;
}

type FilterTab = "pendiente" | "respondida";

function PreguntasContent() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("pendiente");
  const [selectedPregunta, setSelectedPregunta] = useState<Pregunta | null>(null);
  const [respuestaText, setRespuestaText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPreguntas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/preguntas?estado=${activeTab}`, {
        credentials: "include",
      });
      const data = await res.json();
      setPreguntas(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar preguntas");
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchPreguntas();
  }, [fetchPreguntas]);

  const openPregunta = (p: Pregunta) => {
    setSelectedPregunta(p);
    setRespuestaText(p.respuesta || "");
  };

  const closePregunta = () => {
    setSelectedPregunta(null);
    setRespuestaText("");
  };

  const handleResponder = async () => {
    if (!selectedPregunta) return;
    if (!respuestaText.trim()) {
      toast.error("La respuesta no puede estar vacia");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/preguntas", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPregunta.id,
          respuesta: respuestaText.trim(),
          publica: true,
        }),
      });

      if (res.ok) {
        toast.success("Respuesta publicada");
        closePregunta();
        fetchPreguntas();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Error al responder");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSaving(false);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pendiente", label: "Pendientes" },
    { key: "respondida", label: "Respondidas" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          Preguntas
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Gestiona las preguntas de los clientes sobre productos
        </p>
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

      {/* Preguntas List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <MessageCircle className="size-5" />
            Preguntas de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : preguntas.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
              No hay preguntas {activeTab === "pendiente" ? "pendientes" : "respondidas"}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Producto</th>
                    <th className="pb-3 text-left font-medium">Pregunta</th>
                    <th className="hidden pb-3 text-left font-medium sm:table-cell">Autor</th>
                    <th className="hidden pb-3 text-left font-medium md:table-cell">Fecha</th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preguntas.map((p) => {
                    const productoNombre = p.productos?.nombre || "Producto";
                    const preguntaCorta =
                      p.pregunta.length > 60 ? p.pregunta.slice(0, 60) + "..." : p.pregunta;
                    const isPendiente = !p.respuesta;

                    return (
                      <tr
                        key={p.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-gray-50"
                        onClick={() => openPregunta(p)}
                      >
                        <td className="py-3 font-medium" style={{ color: "#1B2A6B" }}>
                          {productoNombre}
                        </td>
                        <td className="py-3" style={{ color: "#1E293B" }}>
                          {preguntaCorta}
                        </td>
                        <td className="hidden py-3 sm:table-cell" style={{ color: "#64748B" }}>
                          {p.autor_nombre}
                        </td>
                        <td className="hidden py-3 md:table-cell" style={{ color: "#64748B" }}>
                          {new Date(p.created_at).toLocaleDateString("es-CL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              isPendiente
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isPendiente ? "Pendiente" : "Respondida"}
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

      {/* ─── Modal Responder ─── */}
      {selectedPregunta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={closePregunta} />
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "#1E293B" }}>
                Responder Pregunta
              </h2>
              <button onClick={closePregunta} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="size-5" style={{ color: "#64748B" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Producto */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
                  Producto
                </label>
                <p className="text-sm font-medium" style={{ color: "#1B2A6B" }}>
                  {selectedPregunta.productos?.nombre || "Producto"}
                </p>
              </div>

              {/* Autor + Fecha */}
              <div className="flex gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
                    Autor
                  </label>
                  <p className="text-sm" style={{ color: "#1E293B" }}>
                    {selectedPregunta.autor_nombre}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
                    Fecha
                  </label>
                  <p className="text-sm" style={{ color: "#1E293B" }}>
                    {new Date(selectedPregunta.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Pregunta completa */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#94A3B8" }}>
                  Pregunta
                </label>
                <p className="rounded-lg bg-gray-50 p-3 text-sm" style={{ color: "#1E293B" }}>
                  {selectedPregunta.pregunta}
                </p>
              </div>

              {/* Respuesta */}
              <div>
                <label className="mb-1 block text-sm font-semibold" style={{ color: "#1E293B" }}>
                  Respuesta
                </label>
                <textarea
                  value={respuestaText}
                  onChange={(e) => setRespuestaText(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  rows={4}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button variant="outline" onClick={closePregunta}>
                Cancelar
              </Button>
              <Button
                onClick={handleResponder}
                disabled={saving}
                style={{ backgroundColor: "#1B2A6B" }}
                className="text-white hover:opacity-90"
              >
                {saving ? "Guardando..." : "Responder y Publicar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreguntasPage() {
  return (
    <AuthGuard>
      <PreguntasContent />
    </AuthGuard>
  );
}

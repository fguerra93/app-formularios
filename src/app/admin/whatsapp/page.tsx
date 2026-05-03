"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  Clock,
  Bot,
  Brain,
  UserCheck,
  XCircle,
  FileText,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import { toast } from "sonner";
import type {
  ConversacionWhatsApp,
  MensajeWhatsApp,
  CotizacionWhatsApp,
} from "@/lib/types";

// ---- Helpers ----

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

function estadoBadge(estado: ConversacionWhatsApp["estado"]) {
  const map: Record<
    string,
    { label: string; bg: string; text: string }
  > = {
    activa: { label: "Activa", bg: "bg-green-100", text: "text-green-700" },
    escalada: { label: "Escalada", bg: "bg-red-100", text: "text-red-700" },
    cerrada: { label: "Cerrada", bg: "bg-gray-100", text: "text-gray-600" },
  };
  return map[estado] || { label: estado, bg: "bg-gray-100", text: "text-gray-600" };
}

function procesadoBadge(procesado: MensajeWhatsApp["procesado_por"]) {
  const map: Record<
    string,
    { label: string; bg: string; text: string }
  > = {
    bot: { label: "Bot", bg: "bg-gray-100", text: "text-gray-600" },
    ia: { label: "IA", bg: "bg-[#00B4D8]/10", text: "text-[#00B4D8]" },
    humano: { label: "Humano", bg: "bg-[#1B2A6B]/10", text: "text-[#1B2A6B]" },
  };
  return map[procesado] || { label: procesado, bg: "bg-gray-100", text: "text-gray-600" };
}

function cotizacionEstadoBadge(estado: CotizacionWhatsApp["estado"]) {
  const map: Record<
    string,
    { label: string; bg: string; text: string }
  > = {
    pendiente: { label: "Pendiente", bg: "bg-yellow-100", text: "text-yellow-700" },
    respondida: { label: "Respondida", bg: "bg-blue-100", text: "text-blue-700" },
    convertida: { label: "Convertida", bg: "bg-green-100", text: "text-green-700" },
  };
  return map[estado] || { label: estado, bg: "bg-gray-100", text: "text-gray-600" };
}

// ---- Types ----

type MainTab = "conversaciones" | "cotizaciones" | "metricas";
type ConvFilter = "todas" | "escaladas" | "activas" | "cerradas";
type CotFilter = "pendientes" | "respondidas" | "convertidas" | "todas";

interface ConvDetail {
  conversacion: ConversacionWhatsApp;
  mensajes: MensajeWhatsApp[];
}

interface WhatsAppStats {
  conversaciones_hoy: number;
  conversaciones_semana: number;
  conversaciones_mes: number;
  resueltas_bot: number;
  resueltas_ia: number;
  resueltas_humano: number;
  cotizaciones_generadas: number;
}

// ===== Conversaciones Tab =====

function ConversacionesTab() {
  const [convs, setConvs] = useState<ConversacionWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConvFilter>("todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConvDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchConvs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "todas") params.set("estado", filter === "escaladas" ? "escalada" : filter === "activas" ? "activa" : "cerrada");
      const res = await fetch(`/api/admin/whatsapp/conversaciones?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setConvs(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar conversaciones");
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchConvs();
  }, [fetchConvs]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/whatsapp/conversaciones/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      setDetail(data);
    } catch {
      toast.error("Error al cargar conversacion");
    }
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (expandedId) {
      fetchDetail(expandedId);
    } else {
      setDetail(null);
    }
  }, [expandedId, fetchDetail]);

  useEffect(() => {
    if (detail && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [detail]);

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setReplyText("");
  };

  const handleSend = async () => {
    if (!replyText.trim() || !expandedId) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/whatsapp/conversaciones/${expandedId}/responder`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensaje: replyText.trim() }),
        }
      );
      if (res.ok) {
        toast.success("Mensaje enviado");
        setReplyText("");
        fetchDetail(expandedId);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al enviar");
      }
    } catch {
      toast.error("Error de conexion");
    }
    setSending(false);
  };

  const handleCerrar = async () => {
    if (!expandedId) return;
    if (!confirm("Cerrar esta conversacion?")) return;
    try {
      const res = await fetch(
        `/api/admin/whatsapp/conversaciones/${expandedId}/responder`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "cerrar" }),
        }
      );
      if (res.ok) {
        toast.success("Conversacion cerrada");
        setExpandedId(null);
        fetchConvs();
      } else {
        toast.error("Error al cerrar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const filters: { key: ConvFilter; label: string; badge?: boolean }[] = [
    { key: "todas", label: "Todas" },
    { key: "escaladas", label: "Escaladas", badge: true },
    { key: "activas", label: "Activas" },
    { key: "cerradas", label: "Cerradas" },
  ];

  const escaladaCount = convs.filter((c) => c.estado === "escalada").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter(f.key);
              setExpandedId(null);
            }}
            style={
              filter === f.key
                ? { backgroundColor: "#1B2A6B", color: "#FFFFFF" }
                : undefined
            }
            className="gap-1.5"
          >
            {f.label}
            {f.badge && filter !== "escaladas" && escaladaCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {escaladaCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <MessageSquare className="size-5" />
            Conversaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : convs.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
              No hay conversaciones
              {filter !== "todas" ? ` ${filter}` : ""}.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {convs.map((conv) => {
                const badge = estadoBadge(conv.estado);
                const isExpanded = expandedId === conv.id;

                return (
                  <div key={conv.id} className="border rounded-lg overflow-hidden">
                    {/* Row */}
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer transition-colors ${
                        isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleExpand(conv.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="flex items-center justify-center size-10 rounded-full shrink-0"
                          style={{ backgroundColor: "#F0F7FF" }}
                        >
                          <Phone className="size-4" style={{ color: "#1B2A6B" }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-medium text-sm"
                              style={{ color: "#1E293B" }}
                            >
                              {conv.whatsapp_phone}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: "#64748B" }}
                          >
                            {conv.contexto && typeof conv.contexto === "object" && "ultimo_mensaje" in conv.contexto
                              ? String(conv.contexto.ultimo_mensaje)
                              : "Sin mensajes recientes"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "#64748B" }}
                        >
                          <Clock className="size-3" />
                          {timeAgo(conv.ultimo_mensaje_at)}
                        </span>
                      </div>
                    </div>

                    {/* Expanded chat view */}
                    {isExpanded && (
                      <div className="border-t bg-[#F8FAFC]">
                        {detailLoading ? (
                          <div className="p-4">
                            <Skeleton className="h-40 rounded-lg" />
                          </div>
                        ) : detail ? (
                          <div className="flex flex-col">
                            {/* Messages */}
                            <div className="max-h-96 overflow-y-auto p-4 flex flex-col gap-3">
                              {detail.mensajes.length === 0 ? (
                                <p
                                  className="text-center text-sm py-8"
                                  style={{ color: "#64748B" }}
                                >
                                  No hay mensajes en esta conversacion.
                                </p>
                              ) : (
                                detail.mensajes.map((msg) => {
                                  const isClient = msg.direccion === "entrante";
                                  const pBadge = procesadoBadge(msg.procesado_por);
                                  return (
                                    <div
                                      key={msg.id}
                                      className={`flex ${isClient ? "justify-start" : "justify-end"}`}
                                    >
                                      <div
                                        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                                          isClient
                                            ? "bg-green-100 text-green-900 rounded-bl-sm"
                                            : "bg-white border border-[#E2E8F0] text-[#1E293B] rounded-br-sm"
                                        }`}
                                      >
                                        <p className="text-sm whitespace-pre-wrap">
                                          {msg.contenido}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <span
                                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${pBadge.bg} ${pBadge.text}`}
                                          >
                                            {msg.procesado_por === "bot" && <Bot className="size-2.5" />}
                                            {msg.procesado_por === "ia" && <Brain className="size-2.5" />}
                                            {msg.procesado_por === "humano" && <UserCheck className="size-2.5" />}
                                            {pBadge.label}
                                          </span>
                                          <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                                            {new Date(msg.created_at).toLocaleTimeString("es-CL", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                              <div ref={chatEndRef} />
                            </div>

                            {/* Reply bar */}
                            {conv.estado !== "cerrada" && (
                              <div className="border-t p-3 flex items-center gap-2 bg-white">
                                <Input
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Escribe un mensaje..."
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSend();
                                    }
                                  }}
                                />
                                <Button
                                  onClick={handleSend}
                                  disabled={sending || !replyText.trim()}
                                  style={{ backgroundColor: "#1B2A6B" }}
                                  className="text-white hover:opacity-90 gap-1.5"
                                  size="sm"
                                >
                                  <Send className="size-3.5" />
                                  Enviar
                                </Button>
                                <Button
                                  onClick={handleCerrar}
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <XCircle className="size-3.5" />
                                  Cerrar
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Cotizaciones Tab =====

function CotizacionesTab() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CotFilter>("pendientes");

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "todas") params.set("estado", filter === "pendientes" ? "pendiente" : filter === "respondidas" ? "respondida" : "convertida");
      const res = await fetch(`/api/admin/whatsapp/cotizaciones?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setCotizaciones(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar cotizaciones");
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchCotizaciones();
  }, [fetchCotizaciones]);

  const filters: { key: CotFilter; label: string }[] = [
    { key: "pendientes", label: "Pendientes" },
    { key: "respondidas", label: "Respondidas" },
    { key: "convertidas", label: "Convertidas" },
    { key: "todas", label: "Todas" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            style={
              filter === f.key
                ? { backgroundColor: "#1B2A6B", color: "#FFFFFF" }
                : undefined
            }
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <FileText className="size-5" />
            Cotizaciones via WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : cotizaciones.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "#64748B" }}>
              No hay cotizaciones {filter !== "todas" ? filter : ""}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ color: "#64748B" }}>
                    <th className="pb-3 text-left font-medium">Cliente</th>
                    <th className="pb-3 text-left font-medium">Producto</th>
                    <th className="hidden pb-3 text-right font-medium sm:table-cell">
                      Cantidad
                    </th>
                    <th className="hidden pb-3 text-right font-medium md:table-cell">
                      Estimado
                    </th>
                    <th className="pb-3 text-center font-medium">Estado</th>
                    <th className="hidden pb-3 text-left font-medium md:table-cell">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cot) => {
                    const badge = cotizacionEstadoBadge(cot.estado);
                    return (
                      <tr
                        key={cot.id}
                        className="border-b last:border-0 hover:bg-gray-50"
                      >
                        <td className="py-3" style={{ color: "#1E293B" }}>
                          <div className="font-medium">
                            {cot.cliente_nombre || "Sin nombre"}
                          </div>
                          {cot.cliente_email && (
                            <div className="text-xs" style={{ color: "#64748B" }}>
                              {cot.cliente_email}
                            </div>
                          )}
                        </td>
                        <td className="py-3" style={{ color: "#64748B" }}>
                          {cot.producto_tipo || "---"}
                        </td>
                        <td
                          className="hidden py-3 text-right sm:table-cell"
                          style={{ color: "#1E293B" }}
                        >
                          {cot.cantidad ?? "---"}
                        </td>
                        <td
                          className="hidden py-3 text-right font-medium md:table-cell"
                          style={{ color: "#1E293B" }}
                        >
                          {cot.estimado_precio
                            ? formatCLP(cot.estimado_precio)
                            : "---"}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td
                          className="hidden py-3 md:table-cell"
                          style={{ color: "#64748B" }}
                        >
                          {new Date(cot.created_at).toLocaleDateString("es-CL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
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

// ===== Metricas Tab =====

function MetricasTab() {
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/whatsapp/stats", {
          credentials: "include",
        });
        const data = await res.json();
        setStats(data);
      } catch {
        toast.error("Error al cargar metricas");
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12 text-sm" style={{ color: "#64748B" }}>
        <AlertCircle className="size-4 mr-2" />
        No se pudieron cargar las metricas.
      </div>
    );
  }

  const totalResueltas =
    (stats.resueltas_bot || 0) +
    (stats.resueltas_ia || 0) +
    (stats.resueltas_humano || 0);

  const pctBot = totalResueltas > 0 ? Math.round(((stats.resueltas_bot || 0) / totalResueltas) * 100) : 0;
  const pctIA = totalResueltas > 0 ? Math.round(((stats.resueltas_ia || 0) / totalResueltas) * 100) : 0;
  const pctHumano = totalResueltas > 0 ? Math.round(((stats.resueltas_humano || 0) / totalResueltas) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Conversation stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center size-10 rounded-lg"
                style={{ backgroundColor: "#F0F7FF" }}
              >
                <MessageSquare className="size-5" style={{ color: "#1B2A6B" }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                  {stats.conversaciones_hoy}
                </p>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Conversaciones hoy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center size-10 rounded-lg"
                style={{ backgroundColor: "rgba(0, 180, 216, 0.1)" }}
              >
                <MessageSquare className="size-5" style={{ color: "#00B4D8" }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                  {stats.conversaciones_semana}
                </p>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Esta semana
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center size-10 rounded-lg"
                style={{ backgroundColor: "rgba(233, 30, 140, 0.06)" }}
              >
                <MessageSquare className="size-5" style={{ color: "#E91E8C" }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                  {stats.conversaciones_mes}
                </p>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  Este mes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1E293B" }}>
            <BarChart3 className="size-5" />
            Resolucion por canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalResueltas === 0 ? (
            <p className="py-4 text-center text-sm" style={{ color: "#64748B" }}>
              Sin datos de resolucion aun.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Bot */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#1E293B" }}>
                    <Bot className="size-4 text-gray-500" />
                    Bot
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#64748B" }}>
                    {stats.resueltas_bot || 0} ({pctBot}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-400 transition-all"
                    style={{ width: `${pctBot}%` }}
                  />
                </div>
              </div>

              {/* IA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#1E293B" }}>
                    <Brain className="size-4" style={{ color: "#00B4D8" }} />
                    IA
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#64748B" }}>
                    {stats.resueltas_ia || 0} ({pctIA}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pctIA}%`, backgroundColor: "#00B4D8" }}
                  />
                </div>
              </div>

              {/* Humano */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#1E293B" }}>
                    <UserCheck className="size-4" style={{ color: "#1B2A6B" }} />
                    Humano
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#64748B" }}>
                    {stats.resueltas_humano || 0} ({pctHumano}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pctHumano}%`, backgroundColor: "#1B2A6B" }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cotizaciones stat */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center size-10 rounded-lg"
              style={{ backgroundColor: "#F0F7FF" }}
            >
              <FileText className="size-5" style={{ color: "#1B2A6B" }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>
                {stats.cotizaciones_generadas}
              </p>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Cotizaciones generadas (este mes)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Main Page =====

function WhatsAppContent() {
  const [activeTab, setActiveTab] = useState<MainTab>("conversaciones");

  const tabs: { key: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "conversaciones", label: "Conversaciones", icon: MessageSquare },
    { key: "cotizaciones", label: "Cotizaciones", icon: FileText },
    { key: "metricas", label: "Metricas", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          WhatsApp Bot
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Gestiona conversaciones, cotizaciones y metricas del bot de WhatsApp
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 border-b border-[#E2E8F0]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
              style={{
                borderBottomColor: isActive ? "#1B2A6B" : "transparent",
                color: isActive ? "#1B2A6B" : "#64748B",
              }}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "conversaciones" && <ConversacionesTab />}
      {activeTab === "cotizaciones" && <CotizacionesTab />}
      {activeTab === "metricas" && <MetricasTab />}
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <AuthGuard>
      <WhatsAppContent />
    </AuthGuard>
  );
}

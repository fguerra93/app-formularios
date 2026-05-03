"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Settings,
  Bot,
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  Mic,
  Tag,
  X,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

// ---- Types ----

interface Conversacion {
  id: string;
  contacto_nombre: string;
  contacto_telefono?: string;
  contacto_username?: string;
  contacto_avatar?: string;
  canal: "whatsapp" | "instagram" | "facebook";
  estado: "abierta" | "cerrada" | "archivada";
  etiquetas: string[];
  ultimo_mensaje: string;
  ultimo_mensaje_at: string;
  no_leidos: number;
  created_at: string;
}

interface Mensaje {
  id: string;
  conversacion_id: string;
  direccion: "entrante" | "saliente";
  contenido: string;
  tipo: "texto" | "imagen" | "audio" | "archivo";
  media_url?: string;
  respuesta_automatica?: boolean;
  estado_envio?: "enviado" | "entregado" | "leido";
  created_at: string;
}

interface ConversacionDetalle {
  conversacion: Conversacion;
  mensajes: Mensaje[];
}

interface MensajeRapido {
  id: string;
  titulo: string;
  contenido: string;
  categoria?: string;
  atajo?: string;
}

interface MensajeriaStats {
  total_conversaciones: number;
  abiertas: number;
  cerradas: number;
  archivadas: number;
  no_leidos: number;
}

// ---- Helpers ----

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return date.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

function canalColor(canal: Conversacion["canal"]) {
  const map = {
    whatsapp: { bg: "#25D366", label: "WhatsApp" },
    instagram: { bg: "#E1306C", label: "Instagram" },
    facebook: { bg: "#1877F2", label: "Facebook" },
  };
  return map[canal] || { bg: "#64748B", label: canal };
}

function CanalIcon({ canal, className }: { canal: Conversacion["canal"]; className?: string }) {
  switch (canal) {
    case "whatsapp":
      return <Phone className={className} />;
    case "instagram":
      return <MessageSquare className={className} />;
    case "facebook":
      return <MessageSquare className={className} />;
    default:
      return <MessageSquare className={className} />;
  }
}

function avatarLetter(name: string) {
  return name.charAt(0).toUpperCase();
}

function DeliveryStatus({ estado }: { estado?: Mensaje["estado_envio"] }) {
  if (!estado) return null;
  if (estado === "leido") return <CheckCheck className="size-3.5 text-[#00B4D8]" />;
  if (estado === "entregado") return <CheckCheck className="size-3.5 text-[#94A3B8]" />;
  return <Check className="size-3.5 text-[#94A3B8]" />;
}

// ---- Mock data for demo ----

const MOCK_CONVERSATIONS: Conversacion[] = [
  {
    id: "1",
    contacto_nombre: "Maria Rodriguez",
    contacto_telefono: "+56912345678",
    canal: "whatsapp",
    estado: "abierta",
    etiquetas: ["vip", "pedido-pendiente"],
    ultimo_mensaje: "Hola, quiero saber el estado de mi pedido #1234",
    ultimo_mensaje_at: new Date(Date.now() - 5 * 60000).toISOString(),
    no_leidos: 2,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "2",
    contacto_nombre: "Carlos Perez",
    contacto_username: "@carlosperez",
    canal: "instagram",
    estado: "abierta",
    etiquetas: ["consulta"],
    ultimo_mensaje: "Me encantaron las poleras! Tienen talla XL?",
    ultimo_mensaje_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    no_leidos: 0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "3",
    contacto_nombre: "Ana Gonzalez",
    contacto_telefono: "+56987654321",
    canal: "whatsapp",
    estado: "abierta",
    etiquetas: [],
    ultimo_mensaje: "Gracias por la informacion!",
    ultimo_mensaje_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    no_leidos: 0,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "4",
    contacto_nombre: "Tienda Fashion",
    contacto_username: "tiendafashion",
    canal: "facebook",
    estado: "cerrada",
    etiquetas: ["mayorista"],
    ultimo_mensaje: "Perfecto, quedo listo el pedido entonces",
    ultimo_mensaje_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    no_leidos: 0,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "5",
    contacto_nombre: "Pedro Soto",
    contacto_telefono: "+56955551234",
    canal: "whatsapp",
    estado: "abierta",
    etiquetas: ["urgente"],
    ultimo_mensaje: "Necesito las tarjetas de presentacion para manana",
    ultimo_mensaje_at: new Date(Date.now() - 30 * 60000).toISOString(),
    no_leidos: 3,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MOCK_MESSAGES: Record<string, Mensaje[]> = {
  "1": [
    {
      id: "m1",
      conversacion_id: "1",
      direccion: "entrante",
      contenido: "Hola, buenas tardes!",
      tipo: "texto",
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: "m2",
      conversacion_id: "1",
      direccion: "saliente",
      contenido: "Hola Maria! Bienvenida a PrintUp. En que podemos ayudarte?",
      tipo: "texto",
      respuesta_automatica: true,
      estado_envio: "leido",
      created_at: new Date(Date.now() - 28 * 60000).toISOString(),
    },
    {
      id: "m3",
      conversacion_id: "1",
      direccion: "entrante",
      contenido: "Quiero saber el estado de mi pedido #1234",
      tipo: "texto",
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      id: "m4",
      conversacion_id: "1",
      direccion: "entrante",
      contenido: "Hola, quiero saber el estado de mi pedido #1234",
      tipo: "texto",
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ],
  "5": [
    {
      id: "m10",
      conversacion_id: "5",
      direccion: "entrante",
      contenido: "Hola, necesito 500 tarjetas de presentacion",
      tipo: "texto",
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    },
    {
      id: "m11",
      conversacion_id: "5",
      direccion: "saliente",
      contenido: "Hola Pedro! Claro, tenemos varias opciones. Te puedo enviar el catalogo?",
      tipo: "texto",
      respuesta_automatica: false,
      estado_envio: "leido",
      created_at: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    },
    {
      id: "m12",
      conversacion_id: "5",
      direccion: "entrante",
      contenido: "Si por favor, y necesito que sea para manana",
      tipo: "texto",
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "m13",
      conversacion_id: "5",
      direccion: "entrante",
      tipo: "imagen",
      contenido: "Adjunto el diseno",
      media_url: "/placeholder.jpg",
      created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
      id: "m14",
      conversacion_id: "5",
      direccion: "entrante",
      contenido: "Necesito las tarjetas de presentacion para manana",
      tipo: "texto",
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    },
  ],
};

const MOCK_QUICK_MESSAGES: MensajeRapido[] = [
  { id: "qm1", titulo: "Saludo", contenido: "Hola! Gracias por contactar a PrintUp. En que podemos ayudarte?", categoria: "general", atajo: "/hola" },
  { id: "qm2", titulo: "Horarios", contenido: "Nuestro horario de atencion es de lunes a viernes de 9:00 a 18:00 hrs.", categoria: "info", atajo: "/horario" },
  { id: "qm3", titulo: "Despedida", contenido: "Gracias por tu preferencia! No dudes en contactarnos si necesitas algo mas.", categoria: "general", atajo: "/bye" },
  { id: "qm4", titulo: "Pedido en camino", contenido: "Tu pedido ya fue despachado y va en camino! Te enviaremos el numero de seguimiento pronto.", categoria: "pedidos", atajo: "/envio" },
];

// ---- Conversation List ----

type CanalFilter = "todos" | "whatsapp" | "instagram" | "facebook";
type EstadoFilter = "abierta" | "cerrada" | "archivada";

function ConversationList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [canalFilter, setCanalFilter] = useState<CanalFilter>("todos");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("abierta");
  const [busqueda, setBusqueda] = useState("");

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (canalFilter !== "todos") params.set("canal", canalFilter);
      params.set("estado", estadoFilter);
      if (busqueda.trim()) params.set("busqueda", busqueda.trim());
      const res = await fetch(`/api/admin/mensajeria/conversaciones?${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : data.data || []);
      } else {
        // Use mock data as fallback
        let filtered = MOCK_CONVERSATIONS;
        if (canalFilter !== "todos") filtered = filtered.filter((c) => c.canal === canalFilter);
        filtered = filtered.filter((c) => c.estado === estadoFilter);
        if (busqueda.trim()) {
          const q = busqueda.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.contacto_nombre.toLowerCase().includes(q) ||
              c.ultimo_mensaje.toLowerCase().includes(q)
          );
        }
        setConversations(filtered);
      }
    } catch {
      // Use mock data as fallback
      let filtered = MOCK_CONVERSATIONS;
      if (canalFilter !== "todos") filtered = filtered.filter((c) => c.canal === canalFilter);
      filtered = filtered.filter((c) => c.estado === estadoFilter);
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.contacto_nombre.toLowerCase().includes(q) ||
            c.ultimo_mensaje.toLowerCase().includes(q)
        );
      }
      setConversations(filtered);
    }
    setLoading(false);
  }, [canalFilter, estadoFilter, busqueda]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const canales: { key: CanalFilter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "whatsapp", label: "WA" },
    { key: "instagram", label: "IG" },
    { key: "facebook", label: "FB" },
  ];

  const estados: { key: EstadoFilter; label: string }[] = [
    { key: "abierta", label: "Abiertas" },
    { key: "cerrada", label: "Cerradas" },
    { key: "archivada", label: "Archivadas" },
  ];

  return (
    <div className="flex h-full flex-col border-r bg-white">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "#1E293B" }}>
            Conversaciones
          </h2>
          <Link href="/admin/mensajeria/configuracion">
            <Button variant="ghost" size="icon">
              <Settings className="size-4" style={{ color: "#64748B" }} />
            </Button>
          </Link>
        </div>

        {/* Canal filter tabs */}
        <div className="flex gap-1 mb-2">
          {canales.map((c) => (
            <button
              key={c.key}
              onClick={() => setCanalFilter(c.key)}
              className="flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
              style={{
                backgroundColor: canalFilter === c.key ? "#1B2A6B" : "#F1F5F9",
                color: canalFilter === c.key ? "#FFFFFF" : "#64748B",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Estado filter */}
        <div className="flex gap-1 mb-2">
          {estados.map((e) => (
            <button
              key={e.key}
              onClick={() => setEstadoFilter(e.key)}
              className="flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
              style={{
                backgroundColor: estadoFilter === e.key ? "#F0F7FF" : "transparent",
                color: estadoFilter === e.key ? "#1B2A6B" : "#94A3B8",
                border: estadoFilter === e.key ? "1px solid #1B2A6B20" : "1px solid transparent",
              }}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" style={{ color: "#94A3B8" }} />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar conversacion..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1 p-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageSquare className="size-8 mb-2" style={{ color: "#CBD5E1" }} />
            <p className="text-xs text-center" style={{ color: "#94A3B8" }}>
              No hay conversaciones
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((conv) => {
              const cc = canalColor(conv.canal);
              const isSelected = selectedId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className="flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-[#F1F5F9] w-full"
                  style={{
                    backgroundColor: isSelected ? "#F0F7FF" : "transparent",
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="relative flex items-center justify-center size-10 rounded-full shrink-0 text-white text-sm font-semibold"
                    style={{ backgroundColor: cc.bg }}
                  >
                    {conv.contacto_avatar ? (
                      <img
                        src={conv.contacto_avatar}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      avatarLetter(conv.contacto_nombre)
                    )}
                    {/* Channel badge */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full border-2 border-white"
                      style={{ backgroundColor: cc.bg }}
                    >
                      <CanalIcon canal={conv.canal} className="size-2.5 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "#1E293B" }}
                      >
                        {conv.contacto_nombre}
                      </span>
                      <span className="text-[10px] shrink-0" style={{ color: "#94A3B8" }}>
                        {timeAgo(conv.ultimo_mensaje_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className="text-xs truncate"
                        style={{ color: conv.no_leidos > 0 ? "#1E293B" : "#64748B", fontWeight: conv.no_leidos > 0 ? 500 : 400 }}
                      >
                        {conv.ultimo_mensaje}
                      </p>
                      {conv.no_leidos > 0 && (
                        <span
                          className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full shrink-0"
                          style={{ backgroundColor: "#1B2A6B" }}
                        >
                          {conv.no_leidos}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Chat Panel ----

function ChatPanel({
  conversacionId,
  onConversacionUpdate,
}: {
  conversacionId: string | null;
  onConversacionUpdate?: () => void;
}) {
  const [detail, setDetail] = useState<ConversacionDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [quickMessages, setQuickMessages] = useState<MensajeRapido[]>([]);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  // Fetch conversation detail
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mensajeria/conversaciones/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      } else {
        // Mock fallback
        const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
        const msgs = MOCK_MESSAGES[id] || [];
        if (conv) {
          setDetail({ conversacion: conv, mensajes: msgs });
        }
      }
    } catch {
      const conv = MOCK_CONVERSATIONS.find((c) => c.id === id);
      const msgs = MOCK_MESSAGES[id] || [];
      if (conv) {
        setDetail({ conversacion: conv, mensajes: msgs });
      }
    }
    setLoading(false);
  }, []);

  // Fetch quick messages
  useEffect(() => {
    async function fetchQuick() {
      try {
        const res = await fetch("/api/admin/mensajeria/mensajes-rapidos", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setQuickMessages(Array.isArray(data) ? data : data.data || []);
        } else {
          setQuickMessages(MOCK_QUICK_MESSAGES);
        }
      } catch {
        setQuickMessages(MOCK_QUICK_MESSAGES);
      }
    }
    fetchQuick();
  }, []);

  useEffect(() => {
    if (conversacionId) {
      fetchDetail(conversacionId);
    } else {
      setDetail(null);
    }
  }, [conversacionId, fetchDetail]);

  useEffect(() => {
    if (detail && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [detail]);

  // Close quick menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target as Node)) {
        setShowQuickMenu(false);
      }
    }
    if (showQuickMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showQuickMenu]);

  const handleSend = async () => {
    if (!messageText.trim() || !conversacionId) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/mensajeria/conversaciones/${conversacionId}/enviar`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contenido: messageText.trim() }),
        }
      );
      if (res.ok) {
        setMessageText("");
        fetchDetail(conversacionId);
        onConversacionUpdate?.();
      } else {
        // Mock: add message locally
        if (detail) {
          const newMsg: Mensaje = {
            id: `m-${Date.now()}`,
            conversacion_id: conversacionId,
            direccion: "saliente",
            contenido: messageText.trim(),
            tipo: "texto",
            respuesta_automatica: false,
            estado_envio: "enviado",
            created_at: new Date().toISOString(),
          };
          setDetail({
            ...detail,
            mensajes: [...detail.mensajes, newMsg],
          });
          setMessageText("");
        }
      }
    } catch {
      // Mock: add message locally
      if (detail) {
        const newMsg: Mensaje = {
          id: `m-${Date.now()}`,
          conversacion_id: conversacionId,
          direccion: "saliente",
          contenido: messageText.trim(),
          tipo: "texto",
          respuesta_automatica: false,
          estado_envio: "enviado",
          created_at: new Date().toISOString(),
        };
        setDetail({
          ...detail,
          mensajes: [...detail.mensajes, newMsg],
        });
        setMessageText("");
      }
    }
    setSending(false);
  };

  const insertQuickMessage = (qm: MensajeRapido) => {
    setMessageText(qm.contenido);
    setShowQuickMenu(false);
  };

  if (!conversacionId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F8FAFC]">
        <div
          className="flex items-center justify-center size-16 rounded-full mb-4"
          style={{ backgroundColor: "#F0F7FF" }}
        >
          <MessageSquare className="size-8" style={{ color: "#1B2A6B" }} />
        </div>
        <h3 className="text-base font-medium mb-1" style={{ color: "#1E293B" }}>
          Bandeja Unificada
        </h3>
        <p className="text-sm text-center max-w-xs" style={{ color: "#64748B" }}>
          Selecciona una conversacion para ver los mensajes y responder desde aqui
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col bg-[#F8FAFC]">
        <div className="border-b bg-white px-4 py-3">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 p-4">
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className={`h-12 rounded-xl ${i % 2 === 0 ? "w-3/5 self-start" : "w-2/5 self-end"}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F8FAFC]">
        <p className="text-sm" style={{ color: "#64748B" }}>
          No se pudo cargar la conversacion
        </p>
      </div>
    );
  }

  const { conversacion: conv, mensajes } = detail;
  const cc = canalColor(conv.canal);

  return (
    <div className="flex flex-1 flex-col bg-[#F8FAFC]">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <div
          className="flex items-center justify-center size-9 rounded-full shrink-0 text-white text-sm font-semibold"
          style={{ backgroundColor: cc.bg }}
        >
          {avatarLetter(conv.contacto_nombre)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate" style={{ color: "#1E293B" }}>
              {conv.contacto_nombre}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: cc.bg }}
            >
              <CanalIcon canal={conv.canal} className="size-2.5" />
              {cc.label}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "#64748B" }}>
            {conv.contacto_telefono || conv.contacto_username || ""}
            {conv.estado !== "abierta" && (
              <span className="ml-2 text-[10px] uppercase font-medium" style={{ color: "#94A3B8" }}>
                ({conv.estado})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2 max-w-3xl mx-auto">
          {mensajes.length === 0 ? (
            <p className="text-center text-sm py-12" style={{ color: "#94A3B8" }}>
              No hay mensajes en esta conversacion
            </p>
          ) : (
            mensajes.map((msg) => {
              const isIncoming = msg.direccion === "entrante";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isIncoming ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                      isIncoming
                        ? "bg-white border border-[#E2E8F0] rounded-bl-sm"
                        : "rounded-br-sm text-white"
                    }`}
                    style={
                      isIncoming
                        ? { color: "#1E293B" }
                        : { backgroundColor: "#1B2A6B", color: "#FFFFFF" }
                    }
                  >
                    {/* Media */}
                    {msg.tipo === "imagen" && (
                      <div className="mb-1.5 rounded-lg bg-gray-100 flex items-center justify-center h-32 overflow-hidden">
                        {msg.media_url ? (
                          <img
                            src={msg.media_url}
                            alt="Imagen"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ImageIcon className="size-8 text-gray-300" />
                        )}
                      </div>
                    )}
                    {msg.tipo === "audio" && (
                      <div className="mb-1.5 flex items-center gap-2 py-1">
                        <Mic className="size-4" style={{ color: isIncoming ? "#64748B" : "#FFFFFF80" }} />
                        <div
                          className="h-1 flex-1 rounded-full"
                          style={{ backgroundColor: isIncoming ? "#E2E8F0" : "#FFFFFF30" }}
                        />
                        <span className="text-[10px]" style={{ color: isIncoming ? "#94A3B8" : "#FFFFFF80" }}>
                          0:15
                        </span>
                      </div>
                    )}

                    {/* Text */}
                    <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>

                    {/* Footer */}
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      {msg.respuesta_automatica === true && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[9px] font-medium"
                          style={{
                            backgroundColor: isIncoming ? "#F1F5F9" : "#FFFFFF20",
                            color: isIncoming ? "#64748B" : "#FFFFFFCC",
                          }}
                        >
                          <Bot className="size-2.5" />
                          Bot
                        </span>
                      )}
                      <span
                        className="text-[10px]"
                        style={{ color: isIncoming ? "#94A3B8" : "#FFFFFF80" }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!isIncoming && <DeliveryStatus estado={msg.estado_envio} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      {conv.estado === "abierta" && (
        <div className="border-t bg-white px-4 py-3">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            {/* Quick messages */}
            <div className="relative" ref={quickMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                title="Mensajes rapidos"
              >
                <Zap className="size-4" style={{ color: "#FF9710" }} />
              </Button>
              {showQuickMenu && quickMessages.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="px-3 py-2 border-b">
                    <p className="text-xs font-medium" style={{ color: "#1E293B" }}>
                      Mensajes rapidos
                    </p>
                  </div>
                  {quickMessages.map((qm) => (
                    <button
                      key={qm.id}
                      onClick={() => insertQuickMessage(qm)}
                      className="w-full text-left px-3 py-2 hover:bg-[#F1F5F9] transition-colors border-b border-[#F8FAFC] last:border-0"
                    >
                      <p className="text-xs font-medium" style={{ color: "#1E293B" }}>
                        {qm.titulo}
                        {qm.atajo && (
                          <span className="ml-1.5 text-[10px] font-normal" style={{ color: "#94A3B8" }}>
                            {qm.atajo}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "#64748B" }}>
                        {qm.contenido}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
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
              disabled={sending || !messageText.trim()}
              style={{ backgroundColor: "#1B2A6B" }}
              className="text-white hover:opacity-90 gap-1.5"
              size="sm"
            >
              <Send className="size-3.5" />
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Contact Info Panel ----

function ContactInfoPanel({
  conversacionId,
  onUpdate,
}: {
  conversacionId: string | null;
  onUpdate?: () => void;
}) {
  const [conv, setConv] = useState<Conversacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (!conversacionId) {
      setConv(null);
      return;
    }
    async function fetchConv() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/mensajeria/conversaciones/${conversacionId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setConv(data.conversacion || data);
        } else {
          setConv(MOCK_CONVERSATIONS.find((c) => c.id === conversacionId) || null);
        }
      } catch {
        setConv(MOCK_CONVERSATIONS.find((c) => c.id === conversacionId) || null);
      }
      setLoading(false);
    }
    fetchConv();
  }, [conversacionId]);

  const updateEstado = async (estado: Conversacion["estado"]) => {
    if (!conv) return;
    try {
      const res = await fetch(`/api/admin/mensajeria/conversaciones/${conv.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (res.ok) {
        setConv({ ...conv, estado });
        toast.success(`Conversacion ${estado}`);
        onUpdate?.();
      } else {
        setConv({ ...conv, estado });
        toast.success(`Conversacion ${estado}`);
        onUpdate?.();
      }
    } catch {
      setConv({ ...conv, estado });
      toast.success(`Conversacion ${estado}`);
      onUpdate?.();
    }
  };

  const addTag = async () => {
    if (!newTag.trim() || !conv) return;
    const etiquetas = [...(conv.etiquetas || []), newTag.trim().toLowerCase()];
    try {
      await fetch(`/api/admin/mensajeria/conversaciones/${conv.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etiquetas }),
      });
    } catch {
      // proceed with local update
    }
    setConv({ ...conv, etiquetas });
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = async (tag: string) => {
    if (!conv) return;
    const etiquetas = (conv.etiquetas || []).filter((t) => t !== tag);
    try {
      await fetch(`/api/admin/mensajeria/conversaciones/${conv.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etiquetas }),
      });
    } catch {
      // proceed with local update
    }
    setConv({ ...conv, etiquetas });
  };

  if (!conversacionId || !conv) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs" style={{ color: "#94A3B8" }}>
          Selecciona una conversacion
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="size-16 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    );
  }

  const cc = canalColor(conv.canal);

  const estadoOptions: { key: Conversacion["estado"]; label: string; color: string }[] = [
    { key: "abierta", label: "Abierta", color: "#10B981" },
    { key: "cerrada", label: "Cerrada", color: "#64748B" },
    { key: "archivada", label: "Archivada", color: "#F59E0B" },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      {/* Avatar and name */}
      <div className="flex flex-col items-center px-4 py-6 border-b">
        <div
          className="flex items-center justify-center size-16 rounded-full text-white text-xl font-bold mb-3"
          style={{ backgroundColor: cc.bg }}
        >
          {avatarLetter(conv.contacto_nombre)}
        </div>
        <h3 className="text-sm font-semibold text-center" style={{ color: "#1E293B" }}>
          {conv.contacto_nombre}
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
          {conv.contacto_telefono || conv.contacto_username || "-"}
        </p>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white mt-2"
          style={{ backgroundColor: cc.bg }}
        >
          <CanalIcon canal={conv.canal} className="size-2.5" />
          {cc.label}
        </span>
      </div>

      {/* Tags */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: "#64748B" }}>
            Etiquetas
          </span>
          <button
            onClick={() => setShowTagInput(!showTagInput)}
            className="rounded p-0.5 hover:bg-[#F1F5F9] transition-colors"
          >
            <Plus className="size-3.5" style={{ color: "#64748B" }} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(conv.etiquetas || []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#F0F7FF]"
              style={{ color: "#1B2A6B" }}
            >
              <Tag className="size-2.5" />
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-0.5 hover:opacity-70">
                <X className="size-2.5" />
              </button>
            </span>
          ))}
          {(conv.etiquetas || []).length === 0 && !showTagInput && (
            <span className="text-[11px]" style={{ color: "#94A3B8" }}>
              Sin etiquetas
            </span>
          )}
        </div>
        {showTagInput && (
          <div className="flex gap-1 mt-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nueva etiqueta"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button size="icon" onClick={addTag} style={{ backgroundColor: "#1B2A6B" }} className="text-white h-7 w-7">
              <Plus className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Estado */}
      <div className="px-4 py-4 border-b">
        <span className="text-xs font-medium block mb-2" style={{ color: "#64748B" }}>
          Estado
        </span>
        <div className="flex flex-col gap-1">
          {estadoOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => updateEstado(opt.key)}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: conv.estado === opt.key ? `${opt.color}15` : "transparent",
                color: conv.estado === opt.key ? opt.color : "#64748B",
                fontWeight: conv.estado === opt.key ? 600 : 400,
              }}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: opt.color }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-4">
        <span className="text-xs font-medium block mb-2" style={{ color: "#64748B" }}>
          Informacion
        </span>
        <div className="flex flex-col gap-2 text-xs" style={{ color: "#64748B" }}>
          <div className="flex items-center gap-2">
            <Clock className="size-3 shrink-0" />
            <span>
              Creado{" "}
              {new Date(conv.created_at).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {conv.contacto_telefono && (
            <div className="flex items-center gap-2">
              <Phone className="size-3 shrink-0" />
              <span>{conv.contacto_telefono}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page Content ----

function MensajeriaContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [listKey, setListKey] = useState(0);

  const handleConversacionUpdate = () => {
    setListKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen -m-6">
      {/* Header */}
      <div className="border-b bg-white px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E293B" }}>
              Mensajeria
            </h1>
            <p className="text-xs" style={{ color: "#64748B" }}>
              Bandeja unificada de WhatsApp, Instagram y Facebook
            </p>
          </div>
          <Link href="/admin/mensajeria/configuracion">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="size-3.5" />
              Configuracion
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: conversation list */}
        <div className="w-full sm:w-80 shrink-0" key={listKey}>
          <ConversationList
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        </div>

        {/* Center: chat */}
        <div className="hidden sm:flex flex-1 flex-col">
          <ChatPanel
            conversacionId={selectedId}
            onConversacionUpdate={handleConversacionUpdate}
          />
        </div>

        {/* Right: contact info */}
        <div className="hidden lg:block w-72 shrink-0 border-l">
          <ContactInfoPanel
            conversacionId={selectedId}
            onUpdate={handleConversacionUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export default function MensajeriaPage() {
  return (
    <AuthGuard>
      <MensajeriaContent />
    </AuthGuard>
  );
}

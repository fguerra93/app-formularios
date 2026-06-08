"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  FileText,
  Clock,
  Package,
  Truck,
  Globe,
  MessageCircle,
  Hand,
} from "lucide-react";

interface OP {
  id: string;
  numero_op: number;
  tipo: string | null;
  cantidad: number | null;
  material: string | null;
  dimensiones: string | null;
  precio_total: number | null;
  estado: string;
  prioridad: number | null;
  tipo_entrega: string | null;
  canal?: string | null;
  archivo_diseno_url?: string | null;
  fecha_compromiso?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

const COLUMNAS = [
  { key: "en_cola", label: "En cola", color: "#64748b" },
  { key: "imprimiendo", label: "Imprimiendo", color: "#00b4d8" },
  { key: "acabado", label: "Acabado", color: "#8b5cf6" },
  { key: "control_calidad", label: "Control calidad", color: "#f59e0b" },
  { key: "listo", label: "Listo", color: "#10b981" },
  { key: "entregado", label: "Entregado", color: "#475569" },
] as const;

const ORDEN: string[] = COLUMNAS.map((c) => c.key);

// SLA orientativo por etapa (minutos). Pinta el semáforo de cada comanda.
const SLA_MIN: Record<string, number> = {
  en_cola: 180,
  imprimiendo: 90,
  acabado: 90,
  control_calidad: 45,
  listo: 240,
};

const POLL_MS = 5000;

function minutosEn(op: OP): number {
  const ref = op.updated_at || op.created_at;
  if (!ref) return 0;
  const ms = Date.now() - Date.parse(ref);
  return ms > 0 ? Math.floor(ms / 60000) : 0;
}

function fmtDur(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function semaforo(estado: string, min: number): { color: string; label: string } {
  const sla = SLA_MIN[estado];
  if (!sla) return { color: "#475569", label: "" };
  const r = min / sla;
  if (r < 0.6) return { color: "#10b981", label: "a tiempo" };
  if (r < 1) return { color: "#f59e0b", label: "atención" };
  return { color: "#ef4444", label: "atrasada" };
}

function CanalBadge({ canal }: { canal?: string | null }) {
  if (!canal) return null;
  const map: Record<string, { icon: typeof Globe; label: string }> = {
    web: { icon: Globe, label: "Web" },
    whatsapp: { icon: MessageCircle, label: "WhatsApp" },
    manual: { icon: Hand, label: "Manual" },
  };
  const it = map[canal] || { icon: Globe, label: canal };
  const Icon = it.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
      <Icon className="size-3" />
      {it.label}
    </span>
  );
}

export function TallerBoard({ operador }: { operador: string }) {
  const [ordenes, setOrdenes] = useState<OP[]>([]);
  const [loading, setLoading] = useState(true);
  const [foco, setFoco] = useState<string>("todas");
  const [, setTick] = useState(0);
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/taller/cola", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError("Sesión sin permisos de taller.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("No se pudo cargar la cola (revisa la base de datos).");
        return;
      }
      setOrdenes(Array.isArray(data.ordenes) ? data.ordenes : []);
      setError(null);
    } catch {
      setError("Sin conexión con la cola.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling de la cola
  useEffect(() => {
    cargar();
    timer.current = setInterval(cargar, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [cargar]);

  // Tick de 1s para que el semáforo "respire" sin re-fetch
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mover = async (op: OP, dir: 1 | -1) => {
    setMoviendo(op.id);
    try {
      const res = await fetch(`/api/taller/op/${op.id}/avanzar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dir }),
      });
      if (res.ok) {
        await cargar();
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.error || "No se pudo mover la comanda");
      }
    } finally {
      setMoviendo(null);
    }
  };

  const columnasVisibles = foco === "todas" ? COLUMNAS : COLUMNAS.filter((c) => c.key === foco);

  const conteo = (key: string) => ordenes.filter((o) => o.estado === key).length;

  return (
    <div className="flex flex-col h-screen">
      {/* Barra superior */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#00b4d8]">
            PrintUp · Comanda de taller
          </p>
          <h1 className="text-lg font-extrabold leading-tight">Cola de producción</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-amber-400">{error}</span>}
          <span className="text-xs text-white/40 hidden sm:inline">{operador}</span>
          <button
            onClick={cargar}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/15"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </header>

      {/* Filtro por estación */}
      <div className="flex gap-1.5 px-4 py-2 border-b border-white/10 overflow-x-auto flex-shrink-0">
        <FocoBtn active={foco === "todas"} onClick={() => setFoco("todas")} label={`Todas (${ordenes.length})`} />
        {COLUMNAS.map((c) => (
          <FocoBtn
            key={c.key}
            active={foco === c.key}
            onClick={() => setFoco(c.key)}
            label={`${c.label} (${conteo(c.key)})`}
            color={c.color}
          />
        ))}
      </div>

      {/* Tablero */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <div className={`flex gap-4 h-full ${foco !== "todas" ? "max-w-2xl mx-auto" : ""}`}>
          {columnasVisibles.map((col) => {
            let items = ordenes
              .filter((o) => o.estado === col.key)
              .sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0));
            // La columna "entregado" solo muestra las más recientes.
            if (col.key === "entregado") items = items.slice(0, 12);
            return (
              <div
                key={col.key}
                className={`flex flex-col ${foco === "todas" ? "w-72" : "flex-1"} flex-shrink-0 h-full`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: col.color }} />
                    <h2 className="text-sm font-bold">{col.label}</h2>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 text-xs text-white/60">{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 rounded-xl bg-white/[0.03] p-2">
                  {items.length === 0 && (
                    <p className="text-center text-xs text-white/25 py-6">Sin comandas</p>
                  )}
                  {items.map((op) => (
                    <ComandaCard
                      key={op.id}
                      op={op}
                      idx={ORDEN.indexOf(op.estado)}
                      moviendo={moviendo === op.id}
                      onMover={mover}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FocoBtn({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "bg-white text-[#0f1115]" : "bg-white/10 text-white/70 hover:bg-white/15"
      }`}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {label}
    </button>
  );
}

function ComandaCard({
  op,
  idx,
  moviendo,
  onMover,
}: {
  op: OP;
  idx: number;
  moviendo: boolean;
  onMover: (op: OP, dir: 1 | -1) => void;
}) {
  const min = minutosEn(op);
  const sem = semaforo(op.estado, min);
  const esEntrega = op.tipo_entrega === "despacho";

  return (
    <div className="rounded-lg bg-white/[0.06] border border-white/10 p-3">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-extrabold text-white">OP #{op.numero_op}</span>
        <CanalBadge canal={op.canal} />
      </div>
      <p className="text-sm text-white/90 leading-tight">{op.tipo || "Trabajo"}</p>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/50">
        <span>x{op.cantidad ?? 1}</span>
        {op.material && <span>{op.material}</span>}
        {op.dimensiones && <span>{op.dimensiones}</span>}
        <span className="inline-flex items-center gap-1">
          {esEntrega ? <Truck className="size-3" /> : <Package className="size-3" />}
          {esEntrega ? "Despacho" : "Retiro"}
        </span>
      </div>

      {/* Semáforo de tiempo en etapa */}
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        <Clock className="size-3" style={{ color: sem.color }} />
        <span style={{ color: sem.color }} className="font-semibold">
          {fmtDur(min)}
        </span>
        {sem.label && <span className="text-white/40">· {sem.label}</span>}
      </div>

      {/* Acciones */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          onClick={() => onMover(op, -1)}
          disabled={idx <= 0 || moviendo}
          className="rounded-md bg-white/10 p-1.5 hover:bg-white/15 disabled:opacity-30"
          title="Retroceder"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => onMover(op, 1)}
          disabled={idx >= ORDEN.length - 1 || moviendo}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-[#00b4d8] px-2 py-1.5 text-xs font-bold text-white hover:bg-[#009ec0] disabled:opacity-30"
        >
          Avanzar
          <ChevronRight className="size-4" />
        </button>
        {op.archivo_diseno_url && (
          <a
            href={op.archivo_diseno_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-white/10 p-1.5 hover:bg-white/15"
            title="Ver archivo"
          >
            <FileText className="size-4" />
          </a>
        )}
      </div>
    </div>
  );
}

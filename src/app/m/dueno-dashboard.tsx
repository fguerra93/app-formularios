"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  Inbox,
  Factory,
  LogOut,
} from "lucide-react";

const CLP = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CL")}`;
const POLL_MS = 15000;

interface Resumen {
  pendientes: number;
  ventas_hoy: number;
  pedidos_hoy: number;
  op: Record<string, number>;
}
interface Aprobacion {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  created_at: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function DuenoDashboard({ usuario }: { usuario: string }) {
  const [resumen, setResumen] = useState<Resumen>({ pendientes: 0, ventas_hoy: 0, pedidos_hoy: 0, op: {} });
  const [aprobaciones, setAprobaciones] = useState<Aprobacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushOn, setPushOn] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [r, a] = await Promise.all([
        fetch("/api/admin/dueno/resumen", { cache: "no-store" }),
        fetch("/api/admin/aprobaciones?estado=pendiente", { cache: "no-store" }),
      ]);
      if (r.ok) setResumen(await r.json());
      if (a.ok) {
        const d = await a.json();
        setAprobaciones(d.aprobaciones || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, POLL_MS);
    return () => clearInterval(t);
  }, [cargar]);

  // ¿Ya hay una suscripción push activa?
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushOn(!!sub))
      .catch(() => {});
  }, []);

  const activarPush = async () => {
    setPushMsg(null);
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushMsg("Este dispositivo no soporta notificaciones push.");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setPushMsg("Permiso de notificaciones denegado.");
      return;
    }
    const keyRes = await fetch("/api/push/vapid-public-key");
    const { key } = await keyRes.json();
    if (!key) {
      setPushMsg("Falta configurar VAPID en el servidor.");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      setPushOn(res.ok);
      setPushMsg(res.ok ? "Notificaciones activadas ✅" : "No se pudo activar.");
    } catch {
      setPushMsg("No se pudo suscribir a las notificaciones.");
    }
  };

  const resolver = async (id: string, accion: "aprobar" | "rechazar") => {
    setProcesando(id);
    try {
      const res = await fetch(`/api/admin/aprobaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      if (res.ok) {
        setAprobaciones((prev) => prev.filter((a) => a.id !== id));
        cargar();
      }
    } finally {
      setProcesando(null);
    }
  };

  const enTaller = Object.values(resumen.op).reduce((s, n) => s + n, 0);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="mx-auto max-w-md px-4 py-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#00b4d8]">PrintUp · Dueño</p>
          <h1 className="text-xl font-extrabold leading-tight">Hola 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="rounded-lg bg-white/10 p-2">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={handleLogout} className="rounded-lg bg-white/10 p-2" title="Cerrar sesión">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* Push */}
      <button
        onClick={activarPush}
        disabled={pushOn}
        className={`mb-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
          pushOn ? "bg-emerald-500/15 text-emerald-300" : "bg-[#00b4d8] text-white"
        }`}
      >
        {pushOn ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        {pushOn ? "Notificaciones activadas" : "Activar notificaciones"}
      </button>
      {pushMsg && <p className="-mt-2 mb-3 text-center text-xs text-white/50">{pushMsg}</p>}

      {/* Cards */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card icon={<TrendingUp className="size-4" />} label="Ventas hoy" value={CLP(resumen.ventas_hoy)} sub={`${resumen.pedidos_hoy} pedidos`} />
        <Card icon={<Inbox className="size-4" />} label="Aprobaciones" value={String(resumen.pendientes)} sub="pendientes" accent={resumen.pendientes > 0} />
        <Card icon={<Factory className="size-4" />} label="En taller" value={String(enTaller)} sub={`${resumen.op["en_cola"] || 0} en cola`} />
        <Card icon={<Check className="size-4" />} label="Listo" value={String(resumen.op["listo"] || 0)} sub="para entregar" />
      </div>

      {/* Aprobaciones */}
      <h2 className="mb-2 text-sm font-bold text-white/80">Aprobaciones pendientes</h2>
      <div className="space-y-2">
        {loading && aprobaciones.length === 0 && <p className="py-6 text-center text-sm text-white/30">Cargando…</p>}
        {!loading && aprobaciones.length === 0 && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] py-8 text-center text-sm text-white/30">
            Todo al día. Sin aprobaciones pendientes.
          </p>
        )}
        {aprobaciones.map((a) => (
          <div key={a.id} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">{a.tipo}</span>
              <span className="text-[10px] text-white/30">{new Date(a.created_at).toLocaleString("es-CL")}</span>
            </div>
            <p className="text-sm font-semibold">{a.titulo}</p>
            {a.descripcion && <p className="mt-0.5 whitespace-pre-line text-xs text-white/50">{a.descripcion}</p>}
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => resolver(a.id, "aprobar")}
                disabled={procesando === a.id}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Check className="size-4" /> Aprobar
              </button>
              <button
                onClick={() => resolver(a.id, "rechazar")}
                disabled={procesando === a.id}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white/80 disabled:opacity-50"
              >
                <X className="size-4" /> Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] text-white/25">{usuario}</p>
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-[#00b4d8]/40 bg-[#00b4d8]/10" : "border-white/10 bg-white/[0.04]"}`}>
      <div className="mb-1 flex items-center gap-1.5 text-white/50">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-xl font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] text-white/40">{sub}</p>
    </div>
  );
}

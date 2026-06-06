"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  leida: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notificaciones", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [cargar]);

  const marcarTodas = async () => {
    await fetch("/api/admin/notificaciones", { method: "PATCH" });
    cargar();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-gray-100"
        aria-label="Notificaciones"
      >
        <span className="text-xl">🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-semibold text-gray-800">Notificaciones</span>
            {noLeidas > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs text-blue-600 hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                Sin notificaciones
              </p>
            ) : (
              items.map((n) => {
                const contenido = (
                  <div
                    className={`border-b px-4 py-3 text-sm ${n.leida ? "bg-white" : "bg-blue-50"}`}
                  >
                    <p className="font-medium text-gray-800">{n.titulo}</p>
                    {n.cuerpo && <p className="text-gray-500">{n.cuerpo}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(n.created_at).toLocaleString("es-CL")}
                    </p>
                  </div>
                );
                return n.enlace ? (
                  <Link key={n.id} href={n.enlace} onClick={() => setOpen(false)}>
                    {contenido}
                  </Link>
                ) : (
                  <div key={n.id}>{contenido}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

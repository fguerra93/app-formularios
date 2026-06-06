"use client";

import { useEffect, useState, useCallback } from "react";

interface Aprobacion {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  estado: string;
  creada_por: string;
  resuelta_por: string | null;
  created_at: string;
  resuelta_at: string | null;
}

const ESTADO_TABS = [
  { key: "pendiente", label: "Pendientes" },
  { key: "aprobada", label: "Aprobadas" },
  { key: "rechazada", label: "Rechazadas" },
];

export default function AprobacionesPage() {
  const [estado, setEstado] = useState("pendiente");
  const [items, setItems] = useState<Aprobacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/aprobaciones?estado=${estado}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setItems(data.aprobaciones || []);
    } finally {
      setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (id: string, accion: "aprobar" | "rechazar") => {
    let nota: string | null = null;
    if (accion === "rechazar") {
      nota = window.prompt("Motivo del rechazo (opcional):") || null;
    }
    setProcesando(id);
    try {
      const res = await fetch(`/api/admin/aprobaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, nota }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "No se pudo resolver");
      } else {
        await cargar();
      }
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Aprobaciones</h1>
      <p className="mb-5 text-sm text-gray-500">
        Nada sensible se ejecuta solo: el bot y el sistema dejan aquí lo que
        necesita tu visto bueno.
      </p>

      <div className="mb-5 flex gap-2">
        {ESTADO_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setEstado(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              estado === t.key
                ? "bg-[#1B2A6B] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-400">
          No hay aprobaciones {estado === "pendiente" ? "pendientes" : estado + "s"}.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {a.tipo.replace("_", " ")}
                  </span>
                  <p className="mt-1 font-semibold text-gray-800">{a.titulo}</p>
                  {a.descripcion && (
                    <p className="text-sm text-gray-500">{a.descripcion}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {a.creada_por} · {new Date(a.created_at).toLocaleString("es-CL")}
                  </p>
                </div>
                {a.estado === "pendiente" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={procesando === a.id}
                      onClick={() => resolver(a.id, "aprobar")}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      disabled={procesando === a.id}
                      onClick={() => resolver(a.id, "rechazar")}
                      className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
                {a.estado !== "pendiente" && (
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      a.estado === "aprobada"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {a.estado}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

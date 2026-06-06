"use client";

import { useEffect, useState, useCallback } from "react";

interface OP {
  id: string;
  numero_op: number;
  tipo: string | null;
  cantidad: number | null;
  material: string | null;
  precio_total: number | null;
  estado: string;
  tipo_entrega: string | null;
}

const COLUMNAS: { key: string; label: string }[] = [
  { key: "en_cola", label: "En cola" },
  { key: "imprimiendo", label: "Imprimiendo" },
  { key: "acabado", label: "Acabado" },
  { key: "control_calidad", label: "Control calidad" },
  { key: "listo", label: "Listo" },
  { key: "entregado", label: "Entregado" },
];

const ORDEN = COLUMNAS.map((c) => c.key);

export default function ProduccionPage() {
  const [ops, setOps] = useState<OP[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/op", { cache: "no-store" });
      setOps(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mover = async (op: OP, dir: 1 | -1) => {
    const i = ORDEN.indexOf(op.estado);
    const nuevo = ORDEN[i + dir];
    if (!nuevo) return;
    const res = await fetch(`/api/admin/op/${op.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevo }),
    });
    if (res.ok) cargar();
    else {
      const e = await res.json().catch(() => ({}));
      alert(e.error || "No se pudo mover");
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Producción — Taller</h1>
      <p className="mb-5 text-sm text-gray-500">
        Mueve cada orden por las etapas. Al marcar “Listo” o “Entregado” se avisa
        al cliente automáticamente.
      </p>

      {loading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNAS.map((col) => {
            const items = ops.filter((o) => o.estado === col.key);
            return (
              <div key={col.key} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">{col.label}</h2>
                  <span className="rounded-full bg-gray-200 px-2 text-xs text-gray-600">
                    {items.length}
                  </span>
                </div>
                <div className="flex min-h-20 flex-col gap-2 rounded-lg bg-gray-100 p-2">
                  {items.map((op) => (
                    <div key={op.id} className="rounded-md bg-white p-3 shadow-sm">
                      <p className="text-xs font-bold text-[#1B2A6B]">OP #{op.numero_op}</p>
                      <p className="text-sm text-gray-800">{op.tipo || "Trabajo"}</p>
                      <p className="text-xs text-gray-500">
                        x{op.cantidad ?? 1} · ${Number(op.precio_total || 0).toLocaleString("es-CL")}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          onClick={() => mover(op, -1)}
                          disabled={ORDEN.indexOf(op.estado) === 0}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200 disabled:opacity-40"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => mover(op, 1)}
                          disabled={ORDEN.indexOf(op.estado) === ORDEN.length - 1}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200 disabled:opacity-40"
                        >
                          ▶
                        </button>
                        <a
                          href={`/api/admin/op/${op.id}/imprimir`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-blue-600 hover:underline"
                        >
                          Imprimir
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

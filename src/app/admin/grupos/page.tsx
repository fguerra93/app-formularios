"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/admin/auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCLP } from "@/lib/format";

interface GrupoAdmin {
  id: string;
  codigo: string;
  nombre: string;
  organizador_nombre: string;
  organizador_email: string;
  meta_unidades: number;
  fecha_limite: string | null;
  estado: string;
  created_at: string;
  progreso: { pagados: number; unidades: number; recaudado: number; participantes: { nombre: string; talla: string | null; estampado: string | null }[] };
}

function GruposContent() {
  const [grupos, setGrupos] = useState<GrupoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/grupos")
      .then((r) => r.json())
      .then((d) => setGrupos(Array.isArray(d) ? d : []))
      .catch(() => setGrupos([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex flex-col gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Pedidos grupales</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Generaciones, equipos y empresas: cada participante paga lo suyo. Produce cuando el grupo complete la meta.
        </p>
      </div>

      {grupos.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm" style={{ color: "#64748B" }}>
          Aún no hay grupos. Se crean desde la ficha del producto → &quot;Pedido grupal&quot;.
        </CardContent></Card>
      ) : (
        grupos.map((g) => {
          const pct = Math.min(100, Math.round((g.progreso.unidades / g.meta_unidades) * 100));
          const completado = g.progreso.unidades >= g.meta_unidades;
          return (
            <Card key={g.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base" style={{ color: "#1E293B" }}>
                    {g.nombre} <span className="ml-2 font-mono text-xs" style={{ color: "#64748B" }}>/grupal/{g.codigo}</span>
                  </CardTitle>
                  <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                    Organiza {g.organizador_nombre} ({g.organizador_email})
                    {g.fecha_limite && <> · cierra {new Date(g.fecha_limite + "T12:00:00").toLocaleDateString("es-CL")}</>}
                  </p>
                </div>
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0"
                  style={{
                    backgroundColor: completado ? "#10B98120" : "#00B4D820",
                    color: completado ? "#10B981" : "#0E7490",
                  }}
                >
                  {completado ? "meta completada" : g.estado}
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: completado ? "#10B981" : "#1B2A6B" }} />
                  </div>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "#1E293B" }}>
                    {g.progreso.unidades}/{g.meta_unidades}
                  </span>
                  <span className="text-sm tabular-nums" style={{ color: "#64748B" }}>
                    {formatCLP(g.progreso.recaudado)} recaudado
                  </span>
                </div>
                <button
                  onClick={() => setAbierto(abierto === g.id ? null : g.id)}
                  className="text-xs font-medium"
                  style={{ color: "#0E7490" }}
                >
                  {abierto === g.id ? "Ocultar" : "Ver"} tallas y nombres ({g.progreso.participantes.length})
                </button>
                {abierto === g.id && (
                  <div className="mt-3 rounded-lg border p-3 print:border-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs" style={{ color: "#64748B" }}>
                          <th className="py-1 pr-3">#</th>
                          <th className="py-1 pr-3">Apoderado/a</th>
                          <th className="py-1 pr-3">Talla</th>
                          <th className="py-1">Nombre estampado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.progreso.participantes.map((p, i) => (
                          <tr key={i} className="border-t" style={{ borderColor: "#F1F5F9" }}>
                            <td className="py-1.5 pr-3 tabular-nums" style={{ color: "#94A3B8" }}>{i + 1}</td>
                            <td className="py-1.5 pr-3" style={{ color: "#1E293B" }}>{p.nombre}</td>
                            <td className="py-1.5 pr-3 font-mono" style={{ color: "#1E293B" }}>{p.talla || "—"}</td>
                            <td className="py-1.5" style={{ color: "#1E293B" }}>{p.estampado || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => window.print()} className="mt-3 text-xs font-medium" style={{ color: "#0E7490" }}>
                      Imprimir lista para el taller
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

export default function AdminGruposPage() {
  return (
    <AuthGuard>
      <GruposContent />
    </AuthGuard>
  );
}

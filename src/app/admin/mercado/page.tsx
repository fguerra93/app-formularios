"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Check, AlertTriangle } from "lucide-react";

const CLP = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString("es-CL")}`;

interface CompRow {
  producto_id: string;
  nombre: string;
  mi_precio: number;
  costo: number;
  mercado_min: number;
  mercado_prom: number;
  competidores: number;
  posicion_pct: number;
  piso_margen: number;
  precio_sugerido: number;
  margen_actual_pct: number | null;
  margen_sugerido_pct: number | null;
  bajo_margen: boolean;
}
interface Competidor { id: string; nombre: string; url?: string | null }
interface Mapeo { id: string; competidor_id: string; producto_id: string | null; nombre_externo: string | null }
interface ProductoMin { producto_id: string; nombre: string }

type Tab = "comparativa" | "competidores" | "mapeos";

export default function MercadoPage() {
  const [tab, setTab] = useState<Tab>("comparativa");
  const [comp, setComp] = useState<CompRow[]>([]);
  const [margenMin, setMargenMin] = useState(25);
  const [competidores, setCompetidores] = useState<Competidor[]>([]);
  const [mapeos, setMapeos] = useState<Mapeo[]>([]);
  const [productos, setProductos] = useState<ProductoMin[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarComparativa = useCallback(async () => {
    const res = await fetch("/api/admin/mercado", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setComp(d.comparativa || []);
      setMargenMin(d.margenMin || 25);
    }
  }, []);
  const cargarCompetidores = useCallback(async () => {
    const res = await fetch("/api/admin/competidores", { cache: "no-store" });
    if (res.ok) setCompetidores(await res.json());
  }, []);
  const cargarMapeos = useCallback(async () => {
    const res = await fetch("/api/admin/productos-competencia", { cache: "no-store" });
    if (res.ok) setMapeos(await res.json());
  }, []);
  const cargarProductos = useCallback(async () => {
    const res = await fetch("/api/admin/costos", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setProductos((d.rentabilidad || []).map((r: { producto_id: string; nombre: string }) => ({ producto_id: r.producto_id, nombre: r.nombre })));
    }
  }, []);

  useEffect(() => {
    Promise.all([cargarComparativa(), cargarCompetidores(), cargarMapeos(), cargarProductos()]).finally(() =>
      setLoading(false)
    );
  }, [cargarComparativa, cargarCompetidores, cargarMapeos, cargarProductos]);

  const aplicar = async (row: CompRow) => {
    if (!window.confirm(`¿Aplicar ${CLP(row.precio_sugerido)} como precio de "${row.nombre}"?`)) return;
    await fetch("/api/admin/mercado/aplicar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_id: row.producto_id, precio: row.precio_sugerido }),
    });
    cargarComparativa();
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "comparativa", label: "Comparativa" },
    { key: "competidores", label: "Competidores" },
    { key: "mapeos", label: "Mapeos & Precios" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Inteligencia de Mercado</h1>
      <p className="mb-5 text-sm text-gray-500">
        ¿Vendo bien? Mi precio vs la competencia y sugerencia que respeta el margen mínimo
        ({margenMin}%). Configurable en <code className="text-xs">margen_minimo_pct</code>.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[#1B2A6B] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : tab === "comparativa" ? (
        <Comparativa rows={comp} onAplicar={aplicar} />
      ) : tab === "competidores" ? (
        <Competidores competidores={competidores} onChange={cargarCompetidores} />
      ) : (
        <Mapeos
          competidores={competidores}
          productos={productos}
          mapeos={mapeos}
          onChange={() => Promise.all([cargarMapeos(), cargarComparativa()])}
        />
      )}
    </div>
  );
}

function Comparativa({ rows, onAplicar }: { rows: CompRow[]; onAplicar: (r: CompRow) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-3 py-3">Producto</th>
            <th className="px-3 py-3 text-right">Mi precio</th>
            <th className="px-3 py-3 text-right">Mercado</th>
            <th className="px-3 py-3 text-right">Posición</th>
            <th className="px-3 py-3 text-right">Margen actual</th>
            <th className="px-3 py-3 text-right">Sugerido</th>
            <th className="px-3 py-3 text-right">Margen sug.</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">Sin datos de mercado. Agrega competidores, mapea productos y registra precios.</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.producto_id}>
              <td className="px-3 py-3 text-gray-800">{r.nombre}</td>
              <td className="px-3 py-3 text-right tabular-nums">{CLP(r.mi_precio)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-gray-600">
                {CLP(r.mercado_min)}<span className="text-gray-400"> · {CLP(r.mercado_prom)}</span>
                <span className="ml-1 text-[10px] text-gray-400">({r.competidores})</span>
              </td>
              <td className="px-3 py-3 text-right">
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${r.posicion_pct > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {r.posicion_pct > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {r.posicion_pct > 0 ? "+" : ""}{r.posicion_pct}%
                </span>
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-gray-500">
                {r.margen_actual_pct == null ? "—" : `${r.margen_actual_pct}%`}
              </td>
              <td className="px-3 py-3 text-right tabular-nums font-semibold text-[#1B2A6B]">
                {CLP(r.precio_sugerido)}
                {r.bajo_margen && (
                  <span title="No se puede igualar al mercado sin perder el margen mínimo">
                    <AlertTriangle className="ml-1 inline size-3.5 text-amber-500" />
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-gray-500">
                {r.margen_sugerido_pct == null ? "—" : `${r.margen_sugerido_pct}%`}
              </td>
              <td className="px-3 py-3 text-right">
                <button
                  onClick={() => onAplicar(r)}
                  disabled={r.precio_sugerido === r.mi_precio}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
                >
                  <Check className="size-3.5" /> Aplicar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Competidores({ competidores, onChange }: { competidores: Competidor[]; onChange: () => void }) {
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const crear = async () => {
    if (!nombre) return;
    await fetch("/api/admin/competidores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, url }),
    });
    setNombre("");
    setUrl("");
    onChange();
  };
  const eliminar = async (id: string) => {
    await fetch(`/api/admin/competidores/${id}`, { method: "DELETE" });
    onChange();
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Competidor</span>
          <input className="mk-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ChileImprime" />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">URL</span>
          <input className="mk-input w-full" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </label>
        <button onClick={crear} className="flex items-center gap-1.5 rounded-lg bg-[#1B2A6B] px-3 py-2 text-sm font-medium text-white">
          <Plus className="size-4" /> Agregar
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Competidor</th><th className="px-4 py-3">URL</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {competidores.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin competidores.</td></tr>}
            {competidores.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-gray-800">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{c.url}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => eliminar(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="inline size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.mk-input{border:1px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.875rem;}`}</style>
    </div>
  );
}

function Mapeos({
  competidores,
  productos,
  mapeos,
  onChange,
}: {
  competidores: Competidor[];
  productos: ProductoMin[];
  mapeos: Mapeo[];
  onChange: () => void;
}) {
  const [competidorId, setCompetidorId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [nombreExterno, setNombreExterno] = useState("");

  const crear = async () => {
    if (!competidorId || !productoId) return;
    await fetch("/api/admin/productos-competencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competidor_id: competidorId, producto_id: productoId, nombre_externo: nombreExterno }),
    });
    setNombreExterno("");
    onChange();
  };
  const eliminar = async (id: string) => {
    await fetch(`/api/admin/productos-competencia?id=${id}`, { method: "DELETE" });
    onChange();
  };
  const registrarPrecio = async (mapeoId: string) => {
    const precio = prompt("Precio observado en la competencia (CLP):");
    if (!precio) return;
    await fetch("/api/admin/precios-competencia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto_competencia_id: mapeoId, precio: Number(precio) || 0 }),
    });
    onChange();
  };

  const compNombre = (id: string) => competidores.find((c) => c.id === id)?.nombre || "—";
  const prodNombre = (id: string | null) => productos.find((p) => p.producto_id === id)?.nombre || "—";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Competidor</span>
          <select className="mk-input min-w-40" value={competidorId} onChange={(e) => setCompetidorId(e.target.value)}>
            <option value="">Selecciona…</option>
            {competidores.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Mi producto</span>
          <select className="mk-input min-w-48" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
            <option value="">Selecciona…</option>
            {productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>)}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">Nombre en la competencia</span>
          <input className="mk-input w-full" value={nombreExterno} onChange={(e) => setNombreExterno(e.target.value)} />
        </label>
        <button onClick={crear} className="flex items-center gap-1.5 rounded-lg bg-[#1B2A6B] px-3 py-2 text-sm font-medium text-white">
          <Plus className="size-4" /> Mapear
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Competidor</th>
              <th className="px-4 py-3">Mi producto</th>
              <th className="px-4 py-3">Nombre externo</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mapeos.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Sin mapeos.</td></tr>}
            {mapeos.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-gray-800">{compNombre(m.competidor_id)}</td>
                <td className="px-4 py-3 text-gray-700">{prodNombre(m.producto_id)}</td>
                <td className="px-4 py-3 text-gray-500">{m.nombre_externo}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => registrarPrecio(m.id)} className="mr-3 text-xs text-[#00B4D8] hover:underline">+ precio</button>
                  <button onClick={() => eliminar(m.id)} className="text-red-500 hover:text-red-700"><Trash2 className="inline size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.mk-input{border:1px solid #e2e8f0;border-radius:8px;padding:.4rem .6rem;font-size:.875rem;}`}</style>
    </div>
  );
}
